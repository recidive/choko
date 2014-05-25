/**
 * @file Choko core services.
 */

'use strict';

/* Services */
angular.module('choko.services', [])

  .factory('Choko', function($resource) {
    return $resource('/rest/:type/:key', {
      type: '@type',
      key: '@key'
    },
    {
      'get': {
        method: 'GET',
        transformResponse: function (data) {
          return angular.fromJson(data).data;
        },
        // Data is an Object, not an Array.
        isArray: false
      }
    });
  })

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
