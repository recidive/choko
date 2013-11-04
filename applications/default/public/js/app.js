'use strict';

// Declare app level module which depends on services, directives and filters.
angular.module('choko', ['ngRoute', 'ngResource', 'ngSanitize', 'choko.services', 'choko.directives', 'choko.filters'])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {redirectTo: '/home'})
    .when(':path*', {
      controller: ApplicationController,
      templateUrl: 'templates/layout.html'
    });

  //$locationProvider.html5Mode(true);
}]);
