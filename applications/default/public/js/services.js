/**
 * @file Choko core services.
 */

'use strict';

// Append services to main choko module.
angular.module('choko')

  // Choko main REST factory.
  .factory('Choko', ['$resource', function($resource) {

    var url = '/rest/:type/:key';
    var defaultParams = {
      type: '@type',
      key: '@key'
    };
    var actions = {
      'get': {
        method: 'GET',
        transformResponse: function (data) {
          return angular.fromJson(data).data;
        },
        // Server will always return an object containing at least a 'data'
        // property to hold the actual data and a status property.
        isArray: false
      }
    }

    return $resource(url, defaultParams, actions);
  }])

  // Application state wrapper, to be shared across controllers.
  // P.s.: States are actual scope objects.
  .factory('applicationState', function() {
    var state = {};
    return {
      get: function() {
        return state;
      },
      set: function(newState) {
        return state = newState;
      }
    };
  });
