/**
 * @file Choko core filters.
 */

'use strict';

angular.module('choko')

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
