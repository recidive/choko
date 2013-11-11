'use strict';

function ApplicationController($scope, $routeParams, $http, applicationState) {
  $http.get($routeParams.path).success(function(data) {
    // Merge data from the server.
    angular.extend($scope, data.data);

    // Store scope as application state.
    applicationState.set($scope);
  });
}
ApplicationController.$inject = ['$scope', '$routeParams', '$http', 'applicationState'];

function PanelController($scope, $location, applicationState, Choko) {
  // Add application state to panel scope so all panels can use this
  // information.
  $scope.application = applicationState.get();

  if ($scope.panel.type && $scope.panel.type !== 'default') {
    // Set view to the panel itself and call ViewController.
    $scope.view = $scope.panel;
    ViewController($scope, $location, applicationState, Choko);
  }

  if ($scope.panel.bare) {
    $scope.template = $scope.panel.template || 'templates/panel-content.html';
  }
  else {
    $scope.template = 'templates/panel.html';
  }
}
//PanelController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function PageController($scope, $location, applicationState, Choko) {
  $scope.page = $scope.application.page;

  if (!$scope.page.type || $scope.page.type === 'default') {
    $scope.items = $scope.page.items || {};
  }
  else {
    // Set view to the panel itself and call ViewController.
    $scope.view = $scope.page;
    ViewController($scope, $location, applicationState, Choko);
  }
}
//PageController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function ItemController($scope, $location, applicationState, Choko) {
}
//ItemController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function ContainerController($scope, $location, applicationState, Choko) {
}
//ContainerController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function RowController($scope, $location, applicationState, Choko) {
  $scope.getTemplate = function() {
    return $scope.template || 'templates/row.html';
  }
}
//RowController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function ColumnController($scope, $location, applicationState, Choko) {
  $scope.getTemplate = function() {
    return $scope.template || 'templates/column.html';
  }
}
//ColumnController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function RegionController($scope, $location, applicationState, Choko) {
}
//RegionController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function NavigationController($scope, $location, applicationState, Choko) {
  $scope.isActive = function(route) {
    //var regexp = new RegExp('^' + pattern + '.*$', ["i"]);
    return route === $location.path();
  };
}
//NavigationController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function ViewController($scope, $location, applicationState, Choko) {
  // handle 'list' type views.
  if ($scope.view.type === 'list' && $scope.view.itemType) {
    $scope.items = {};

    Choko.get({type: $scope.view.itemType}, function(response) {
      $scope.items = response;
    });
  }

  // handle 'item' type views.
  if ($scope.view.type === 'item' && $scope.view.itemType) {
    $scope.item = {};

    Choko.get({type: $scope.view.itemType, key: $scope.view.itemKey}, function(response) {
      $scope.item = response;
    });
  }
}
//ViewController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];
