'use strict';

angular.module('choko.controllers')

.controller('DisplayRegionController', ['$scope',
  function ($scope) {
    if ($scope.display && 'instances' in $scope.display && $scope.view.itemType in $scope.display.instances) {
      $scope.elements = $scope.display.instances[$scope.view.itemType];
    }
  }])

.controller('DisplayFieldController', ['$scope', 'Params',
  function ($scope, Params) {
    if ($scope.field.fieldName in $scope.item) {
      $scope.value = $scope.item[$scope.field.fieldName];
    }

    $scope.template = $scope.field.template || '/templates/' + $scope.field.format + '.html';
  }]);
