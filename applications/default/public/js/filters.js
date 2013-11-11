'use strict';

/* Filters */

angular.module('choko.filters', [])
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
