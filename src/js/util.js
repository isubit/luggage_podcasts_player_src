'use strict';

/**
 * return new value in bounds of min and max
 * @param {number} val any number
 * @param {number} min lower boundary for val
 * @param {number} max upper boundary for val
 * @returns {number} resulting value
 */
function cap(val, min, max) {
  // cap x values
  val = Math.max(val, min);
  val = Math.min(val, max);
  return val;
}

/**
 * return number as string lefthand filled with zeros
 * @param {number} number (integer) value to be padded
 * @param {number} width length of the string that is returned
 * @returns {string} padded number
 */
function zeroFill (number, width) {
  var s = number.toString();
  while (s.length < width) {
    s = '0' + s;
  }
  return s;
}

function getWindowOrigin() {
  if (window.location.origin) { // Some browsers (mainly IE) does not have this property, so we need to build it manually...
    return window.location.origin;
  } else {
    return window.location.protocol + '//' + window.location.hostname + (window.location.port ? (':' + window.location.port) : '');
  }
}

module.exports = {
  cap: cap,
  zeroFill: zeroFill,
  getWindowOrigin: getWindowOrigin
};
