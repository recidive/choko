'use strict';

angular.module('choko.controllers')

.controller('NavigationController', ['$scope', '$location',
  function ($scope, $location) {

    // Avoid undefined.
    $scope.panel.classes = $scope.panel.classes || [];

    $scope.panel.classes.unshift('nav');

    $scope.isAbsolute = function(url) {
      return /^(?:[a-z]+:)?\/\//i.test(url);
    };

    $scope.goTo = function(url, $event) {
      $location.path(url);
      if ($event) {
        $event.preventDefault();
      }
    };

    $scope.isActive = function(route) {
      //var regexp = new RegExp('^' + pattern + '.*$', ["i"]);
      return route === $location.path();
    };
  }])

.controller('NavigationItemController', ['$scope', '$location', 'Params',
  function ($scope, $location, Params) {
    var item = $scope.subItem || $scope.item;
    item.title = Params.parse(item.title, $scope);
  }]);
