'use strict';

/**
 * @file Display extension controllers.
 */

angular.module('choko')

.controller('DisplayRegionController', ['$scope',
  function ($scope) {
    if ($scope.display && 'instances' in $scope.display && $scope.view.itemType in $scope.display.instances) {
      $scope.elements = $scope.display.instances[$scope.view.itemType];
    }
  }])

.controller('DisplayFieldController', ['$scope', 'Token',
  function ($scope, Token) {
    if ($scope.field.fieldName in $scope.item) {
      $scope.value = $scope.item[$scope.field.fieldName];
    }

    if ($scope.field.link) {
      $scope.link = Token.replace($scope.field.link, $scope);
    }

    $scope.template = $scope.field.template || '/templates/' + $scope.field.format + '.html';
  }]);
