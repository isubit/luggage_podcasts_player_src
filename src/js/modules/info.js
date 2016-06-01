'use strict';

var Tab = require('../tab')
  , timeCode = require('../timecode')
  , services = require('../social-networks');

function getPublicationDate(rawDate) {
  if (!rawDate) {
    return '';
  }
  var date = new Date(rawDate);
  return '<p>Published on: ' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear() + '</p>';
}

function getSummary (summary) {
  if (summary && summary.length > 0) {
    var element = $('<p></p>');
    element.append(summary);
    element.find('a').attr('target', '_blank');
    return element.html();
  }
  return '';
}

function createEpisodeInfo(tab, params) {
  tab.createMainContent(
    '<h2>' + params.title + '</h2>' +
    //'<h3>' + params.subtitle + '</h3>' +
    getSummary(params.summary) +
    '<p>Duration: ' + timeCode.fromTimeStamp(params.duration) + '</p>' +
     getPublicationDate(params.publicationDate) //+
    //'<p class="info-link">' +
    //  'Permalink:<br>' +
    //  '<a href="' + params.permalink + '" target="_blank" title="Permalink for Episode">' + params.permalink + '</a>' +
    //'</p>'
  );
}

function createPosterImage(poster) {
  if (!poster) {
    return '';
  }
  return '<div class="poster-image">' +
    '<img src="' + poster + '" data-img="' + poster + '" alt="Poster Image">' +
    '</div>';
}

function createSubscribeButton(params) {
  if (!params.subscribeButton) {
    return '';
  }
  return '<button class="button-submit">' +
      '<span class="showtitle-label">' + params.show.title + '</span>' +
      '<span class="submit-label">' + params.subscribeButton + '</span>' +
    '</button>';
}

function createShowInfo (tab, params) {
  tab.createAside(
    '<h2>' + params.show.title + '</h2>' +
    //'<h3>' + params.show.subtitle + '</h3>' +
    createPosterImage(params.show.poster) +
    createSubscribeButton(params) +
    '<p class="info-link">Permalink to the Podcast:<br>' +
      '<a href="' + params.show.url + '" target="_blank" title="Permalink to the Podcast">' + params.show.url + '</a></p>'
  );
}

function createSocialLink(options) {
  var service = services.get(options.serviceName);
  var listItem = $('<li></li>');
  var button = service.getButton(options);
  listItem.append(button.element);
  this.append(listItem);
}

function createSocialInfo(profiles) {
  if (!profiles) {
    return null;
  }

  var profileList = $('<ul></ul>');
  profiles.forEach(createSocialLink, profileList);

  var container = $('<div class="social-links"><h3>Stay in Touch</h3></div>');
  container.append(profileList);
  return container;
}

/**
 * Create footer with license area and social media profiles,
 * if (params.license && params.show) and params.profiles
 * are defined
 * @param  {Tab} tab
 * @param  {object} params
 */
function createSocialAndLicenseInfo (tab, params) {
  var footer, footerContent,
    completeLicenseInfo = params.license && params.license.url && params.license.name && params.show.title;
  if (!completeLicenseInfo && !params.profiles) {
    return;
  }
  footerContent = '';
  if (completeLicenseInfo) {
    footerContent = '<p class="license-area">The Show "' + params.show.title + '" is licensed under<br>' +
        '<a href="' + params.license.url + '" target="_blank" title="View License">' + params.license.name + '</a>' +
      '</p>';
  }
  footer = tab.createFooter(footerContent);
  footer.prepend(createSocialInfo(params.profiles));
}

/**
 * create info tab if params.summary is defined
 * @param {object} params parameter object
 * @returns {null|Tab} info tab instance or null
 */
function createInfoTab(params) {
  // if (!params.summary) {
  //   return null;
  // }
  var infoTab = new Tab({
    icon: 'pwp-info',
    title: 'Show / Hide Info',
    headline: 'Info',
    name: 'info'
  });

  createEpisodeInfo(infoTab, params);
  createShowInfo(infoTab, params);
  createSocialAndLicenseInfo(infoTab, params);

  return infoTab;
}

/**
 * Information module to display podcast and episode info
 * @param {object} params parameter object
 * @constructor
 */
function Info(params) {
  this.tab = createInfoTab(params);
}

module.exports = Info;
