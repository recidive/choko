'use strict';

angular.module('choko')

.controller('RowController', ['$scope',
  function ($scope) {
    $scope.name = $scope.row.name;

    $scope.getTemplate = function() {
      return $scope.template || '/templates/row.html';
    }
  }])

.controller('ColumnController', ['$scope',
  function ($scope) {
    $scope.name = $scope.column.name;

    $scope.getTemplate = function() {
      return $scope.template || '/templates/column.html';
    };
  }])

.controller('RegionController', ['$scope',
  function ($scope) {

  }]);
