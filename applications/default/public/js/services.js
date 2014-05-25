/**
 * @file Choko core services.
 */

'use strict';

/* Services */
angular.module('choko.services', [])

  /**
   * Choko main REST factory.
   * @param  {object} $resource
   * @return {object} A RESTful resource.
   */
  .factory('Choko', ['$resource', function($resource) {

    var url = '/rest/:type/:key';
    var defaultParams = {
      type: '@type',
      key: '@key'
    };
    var actions = {
      'get': {
        method: 'GET',
        /**
         * Modifies and parses the returned data.
         * @param  {object} data
         * @return {object|object[]} data.data
         */
        transformResponse: function (data) {
          return angular.fromJson(data).data;
        },
        // Data is an object containing a property called data, which contains
        // the actual retrieved data.
        isArray: false
      }
    }

    return $resource(url, defaultParams, actions);
  }])

  /**
   * Application state wrapper, to be shared across controllers.
   * P.s.: States are actual scopes.
   */
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
