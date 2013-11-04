'use strict';

/* Services */
angular.module('choko.services', [])
  // Single value service for Choko version.
  .value('version', '0.0.1')

  // Shared server with application state.
  .factory('applicationState', function($rootScope) {
    var state = {};
    return {
      get: function() {
        return state;
      },
      set: function(newState) {
        return state = newState;
      },
    };
  });
