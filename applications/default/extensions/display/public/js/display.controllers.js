'use strict';

angular.module('choko.controllers')

.controller('DisplayRegionController', ['$scope',
  function ($scope) {

  }])

.controller('DisplayFieldController', ['$scope',
  function ($scope) {
    $scope.field.template = $scope.field.template || '/templates/' + $scope.field.format + '.html';
  }]);
