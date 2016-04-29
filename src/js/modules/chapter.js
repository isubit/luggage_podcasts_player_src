'use strict';

var tc = require('../timecode')
  , Tab = require('../tab');

var log = require('../logging').getLogger('Chapters');

var ACTIVE_CHAPTER_THRESHHOLD = 0.1;

function rowClickHandler (e) {
  e.preventDefault();
  var chapters = e.data.module;
  log.debug('clickHandler', 'setCurrentChapter to', e.data.index);
  chapters.setCurrentChapter(e.data.index);
  chapters.playCurrentChapter();
  chapters.timeline.player.play();
  return false;
}

function transformChapter(chapter) {
  chapter.code = chapter.title;
  if (typeof chapter.start === 'string') {
    chapter.start = tc.getStartTimeCode(chapter.start);
  }
  return chapter;
}

/**
 * add `end` property to each simple chapter,
 * needed for proper formatting
 * @param {number} duration
 * @returns {function}
 */
function addEndTime(duration) {
  return function (chapter, i, chapters) {
    var next = chapters[i + 1];
    chapter.end = next ? next.start : duration;
    return chapter;
  };
}

function render(html) {
  return $(html);
}

/**
 * render HTMLTableElement for chapters
 * @returns {jQuery|HTMLElement}
 */
function renderChapterTable() {
  return render(
    '<table class="podlovewebplayer_chapters"><caption>Kapitel</caption>' +
      '<thead>' +
        '<tr>' +
          '<th scope="col">Kapitelnummer</th>' +
          '<th scope="col">Startzeit</th>' +
          '<th scope="col">Titel</th>' +
          '<th scope="col">Dauer</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody></tbody>' +
    '</table>'
  );
}

/**
 *
 * @param {object} chapter
 * @returns {jQuery|HTMLElement}
 */
function renderRow (chapter, index) {
  return render(
    '<tr class="chapter">' +
      '<td class="chapter-number"><div class="badge">' + (index + 1) + '</div></td>' +
      '<td class="chapter-name"><div>' + chapter.code + '</div>' + (!!chapter.url ? '<div><a target="_parent" href="' + chapter.url + '">' + chapter.url + '</a></div>' : '') + '</td>' +
      '<td class="chapter-duration"><div>' + chapter.duration + '</div></td>' +
    '</tr>'
  );
}

/**
 *
 * @param {Array} chapters
 * @returns {number}
 */
function getMaxChapterStart(chapters) {
  function getStartTime (chapter) {
    return chapter.start;
  }
  return Math.max.apply(Math, $.map(chapters, getStartTime));
}

/**
 *
 * @param {{end:{number}, start:{number}}} chapter
 * @param {number} currentTime
 * @returns {boolean}
 */
function isActiveChapter (chapter, currentTime) {
  if (!chapter) {
    return false;
  }
  return (currentTime > chapter.start - ACTIVE_CHAPTER_THRESHHOLD && currentTime <= chapter.end);
}

/**
 * update the chapter list when the data is loaded
 * @param {Timeline} timeline
 */
function update (timeline) {
  var activeChapter = this.getActiveChapter()
    , currentTime = timeline.getTime();

  log.debug('update', this, activeChapter, currentTime);
  if (isActiveChapter(activeChapter, currentTime)) {
    log.debug('update', 'already set', this.currentChapter);
    return;
  }
  function markChapter (chapter, i) {
    var isActive = isActiveChapter(chapter, currentTime);
    if (isActive) {
      this.setCurrentChapter(i);
    }
  }
  this.chapters.forEach(markChapter, this);
}

/**
 * chapter handling
 * @params {Timeline} params
 * @return {Chapters} chapter module
 */
function Chapters (timeline, params) {

  if (!timeline || !timeline.hasChapters) {
    return null;
  }
  if (timeline.duration === 0) {
    log.warn('constructor', 'Zero length media?', timeline);
  }

  this.timeline = timeline;
  this.duration = timeline.duration;
  this.chapterlinks = !!timeline.chapterlinks;
  this.currentChapter = 0;
  this.chapters = this.parseSimpleChapter(params);
  this.data = this.chapters;

  this.tab = new Tab({
    icon: 'pwp-chapters',
    title: 'Kapitel anzeigen / verbergen',
    headline: 'Kapitel',
    name: 'chapters'
  });

  this.tab
    .createMainContent('')
    .append(this.generateTable());

  this.update = update.bind(this);
}

/**
 * Given a list of chapters, this function creates the chapter table for the player.
 * @returns {jQuery|HTMLDivElement}
 */
Chapters.prototype.generateTable = function () {
  var table, tbody, maxchapterstart, forceHours;

  table = renderChapterTable();
  tbody = table.children('tbody');

  maxchapterstart = getMaxChapterStart(this.chapters);
  forceHours = (maxchapterstart >= 3600);

  function buildChapter(chapter, index) {
    var duration = Math.round(chapter.end - chapter.start);

    //make sure the duration for all chapters are equally formatted
    chapter.duration = tc.generate([duration], false);

    //if there is a chapter that starts after an hour, force '00:' on all previous chapters
    chapter.startTime = tc.generate([Math.round(chapter.start)], true, forceHours);

    //insert the chapter data
    var row = renderRow(chapter, index);
    row.on('click', {module: this, index: index}, rowClickHandler);
    row.find('a').on('click', function(event) { event.stopPropagation(); });
    row.appendTo(tbody);
    chapter.element = row;
  }

  this.chapters.forEach(buildChapter, this);
  return table;
};

Chapters.prototype.getActiveChapter = function () {
  var active = this.chapters[this.currentChapter];
  log.debug('getActiveChapter', active);
  return active;
};

/**
 *
 * @param {number} chapterIndex
 */
Chapters.prototype.setCurrentChapter = function (chapterIndex) {
  if (chapterIndex < this.chapters.length && chapterIndex >= 0) {
    this.currentChapter = chapterIndex;
  }
  this.markActiveChapter();
  log.debug('setCurrentChapter', 'to', this.currentChapter);
};

Chapters.prototype.markActiveChapter = function () {
  var activeChapter = this.getActiveChapter();
  $.each(this.chapters, function () {
    this.element.removeClass('active');
  });
  activeChapter.element.addClass('active');
};

Chapters.prototype.next = function () {
  var current = this.currentChapter,
    next = this.setCurrentChapter(current + 1);
  if (current === next) {
    log.debug('next', 'already in last chapter');
    return current;
  }
  log.debug('next', 'chapter', this.currentChapter);
  this.playCurrentChapter();
  return next;
};

Chapters.prototype.previous = function () {
  var current = this.currentChapter,
    previous = this.setCurrentChapter(current - 1);
  if (current === previous) {
    log.debug('previous', 'already in first chapter');
    this.playCurrentChapter();
    return current;
  }
  log.debug('previous', 'chapter', this.currentChapter);
  this.playCurrentChapter();
  return previous;
};

Chapters.prototype.playCurrentChapter = function () {
  var start = this.getActiveChapter().start;
  log.debug('playCurrentChapter', 'start', start);
  var time = this.timeline.setTime(start);
  log.debug('playCurrentChapter', 'currentTime', time);
};

Chapters.prototype.parseSimpleChapter = function (params) {
  var chapters = params.chapters;
  if (!chapters) {
    return [];
  }

  return chapters
    .map(transformChapter)
    .map(addEndTime(this.duration))
    .sort(function (a, b) { // order is not guaranteed: http://podlove.org/simple-chapters/
      return a.start - b.start;
    });
};

module.exports = Chapters;
