'use strict';

/**
 * @file Panel extension controllers.
 */

angular.module('choko')

.controller('PanelController', ['$scope', '$controller',
  function ($scope, $controller) {
    if ($scope.panel.type && $scope.panel.type !== 'default') {
      // Set view to the panel itself and call ViewController.
      $scope.view = $scope.panel;

      // Inherit controller.
      $controller('ViewController', {
        $scope: $scope
      });
    }

    if ($scope.panel.bare) {
      $scope.template = $scope.panel.template || '/templates/panel-content.html';
    }
    else {
      $scope.template = '/templates/panel.html';
    }
  }]);
