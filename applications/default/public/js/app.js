'use strict';

// Declare app level module which depends on services, directives and filters.
<<<<<<< HEAD
angular.module('choko', ['ngRoute', 'ngResource', 'ngSanitize', 'summernote', 'angularFileUpload', 'choko.services', 'choko.directives', 'choko.filters', 'choko.controllers'])
=======
angular.module('choko', ['ngRoute', 'ngResource', 'ngSanitize', 'summernote', 'restangular', 'angularFileUpload', 'choko.services', 'choko.directives', 'choko.filters'])
>>>>>>> Added restangular
.config(['$locationProvider', function($locationProvider) {
  //$locationProvider.html5Mode(true);
}])
.config(['RestangularProvider', function(RestangularProvider) {
  RestangularProvider.setBaseUrl('/rest');

  // Add a response intereceptor
  RestangularProvider.addResponseInterceptor(function(data, operation, what, url, response, deferred) {
    var extractedData;

    if (operation === "getList") {
      var temp = [];

      Object.keys(data.data).forEach(function(name){
        temp.push(data.data[name])
      });

      extractedData = temp;
    } else {
      extractedData = data.data;
    }
    return extractedData;
  });

  RestangularProvider.setResponseExtractor(function(response) {
    var newResponse = response;
    if (angular.isArray(response)) {
      angular.forEach(newResponse, function(value, key) {
        newResponse[key].originalElement = angular.copy(value);
      });
    } else {
      newResponse.originalElement = angular.copy(response);
    }
    return newResponse;
  });
}]);
