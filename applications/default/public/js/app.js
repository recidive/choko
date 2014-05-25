/**
 * @file Main AngularJS module for the choko application.
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
  'choko.filters'
];

// Declare main choko module.
angular.module('choko', dependencies)

  /**
   * Configures the location provider.
   * @param  {object} $locationProvider
   */
  .config(['$locationProvider', function($locationProvider) {

    // Use HTML5 mode to remove "#" symbols from angular-routed pages.
    // $locationProvider.html5Mode(true);

  }]);
