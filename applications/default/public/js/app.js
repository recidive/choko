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
  'angularFileUpload'
];

// Declare main choko module.
angular.module('choko', dependencies)

  // Define current choko version.
  // @todo: we should read package.json and make available not only a version
  // value but other metadata that might be used thoughout the application.
  .value('version', '0.0.4')

  /**
   * Configures the location provider.
   * @param  {object} $locationProvider
   */
  .config(['$locationProvider', function($locationProvider) {

    // Use HTML5 mode to remove "#" symbols from angular-routed pages.
    // $locationProvider.html5Mode(true);

  }]);
