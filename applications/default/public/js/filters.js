/**
 * @file Choko core filters.
 */

'use strict';

angular.module('choko')
  .filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }])

  /**
   * Returns the keys of a given acceptable value/object.
   * @param {object|array|function} input
   * @return {array}
   */
  .filter('keys', function() {
    return function(input) {
      return Boolean(['object', 'function'].indexOf(typeof input) + 1) ? Object.keys(input) : [];
    }
  });
