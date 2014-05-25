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
  .filter('keys', function() {
    return function(input) {
      if (!input) {
        return [];
      }
      return Object.keys(input);
    }
  });
