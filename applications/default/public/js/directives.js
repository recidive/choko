'use strict';

/**
 * @file Choko core directives.
 */

angular.module('choko')

  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])

  .directive('ckReplace', ['$http', '$compile', function($http, $compile) {
    return {
      restrict: 'E',
      scope: true,
      compile: function(element, attrs) {
        return function(scope, element, attrs) {
          scope.element.template = scope.element.template || '/templates/' + scope.element.type + '.html';
          $http({method: 'GET', url: scope.element.template, cache: true}).then(function(result) {
            var template = angular.element($compile(result.data)(scope));
            element.replaceWith(template);
          });
        };
      }
    };
  }])

  .directive('ckButton', ['$http', '$compile', function($http, $compile) {
    return {
      restrict: 'E',
      scope: true,
      compile: function(element, attrs) {
        return function(scope, element, attrs) {
          var template = scope.item.items ? '/templates/btn-group-dropdown.html' : '/templates/btn-group-button.html';
          scope.item.classes = scope.item.classes || ['btn-default'];

          $http({method: 'GET', url: template, cache: true}).then(function(result) {
            var template = angular.element($compile(result.data)(scope));
            element.replaceWith(template);
          });
        };
      }
    };
  }]);
