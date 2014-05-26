/**
 * @file Choko core filters.
 */

'use strict';

angular.module('choko')

  // Filter to get an array of keys for an object.
  .filter('keys', function() {
    
    /**
     * Returns the keys of a given acceptable value/object.
     * @param {object|array|function} input
     * @return {array}
     */
    function objectKeysFilter(input) {
      return Boolean(['object', 'function'].indexOf(typeof input) + 1) ? Object.keys(input) : [];
    }

    return objectKeysFilter;
  });
