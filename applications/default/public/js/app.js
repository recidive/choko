/*
 * Main choko application definition file.
 */

'use strict';

// Define core choko dependencies.
var dependencies = [
  'ngRoute',
  'ngResource',
  'ngSanitize',
  'summernote',
  'angularFileUpload',
  'choko.services',
  'choko.directives',
  'choko.filters'
];

// Declare main choko module.
angular.module('choko', dependencies)

  /**
   * Main configuration.
   */
  .config(['$locationProvider', function($locationProvider) {

    // Use HTML5 mode to remove "#" symbols from angular-routed pages.
    // $locationProvider.html5Mode(true);

  }]);
