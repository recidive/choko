'use strict';

angular.module('choko.controllers')

.controller('PageController', ['$scope', '$controller',
  function ($scope, $controller) {
    if (!$scope.page.type || $scope.page.type === 'default') {
      $scope.items = $scope.page.items || {};
      $scope.title = $scope.page.title;
    }
    else {
      // Set view to the panel itself and call ViewController.
      $scope.view = $scope.page;

      // Inherit controller.
      $controller('ViewController', {
        $scope: $scope
      });
    }
  }]);
