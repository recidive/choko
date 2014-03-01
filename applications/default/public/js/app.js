'use strict';

// Declare app level module which depends on services, directives and filters.
angular.module('choko', ['ngRoute', 'ngResource', 'ngSanitize', 'summernote', 'choko.services', 'choko.directives', 'choko.filters'])
.config(['$locationProvider', function($locationProvider) {
  //$locationProvider.html5Mode(true);
}]);
