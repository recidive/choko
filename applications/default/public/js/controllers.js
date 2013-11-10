'use strict';

function ApplicationController($scope, $routeParams, $http, applicationState) {
  $http.get($routeParams.path).success(function(data) {
    // Merge data from the server.
    angular.extend($scope, data.data);

    // Store scope as application state.
    applicationState.set($scope);
  });

  // Fix for sorting objects. By default they are sorted by associative index.
  // <div ng-repeat="key in notSorted(objToRepeat)" ng-init="value = objToRepeat[key]"></div>
  // https://groups.google.com/forum/#!msg/angular/N87uqMfwcTs/KLe-avlAXzAJ
  $scope.notSorted = function(obj) {
    if (!obj) {
      return [];
    }
    return Object.keys(obj);
  };
}
ApplicationController.$inject = ['$scope', '$routeParams', '$http', 'applicationState'];

function RegionController($scope, $location) {
  $scope.blocks = {
    'menu': [
      {
        title: 'Navigation',
        template: 'templates/navbar.html',
        weight: 0
      }
    ]
  };
}
//RegionController.$inject = ['$scope', '$location'];

function PanelController($scope, $location, applicationState, Choko) {
  // Add application state to panel scope so all panels can use this
  // information.
  $scope.application = applicationState.get();

  if ($scope.panel.type && $scope.panel.type !== 'default') {
    // Set view to the panel itself and call ViewController.
    $scope.view = $scope.panel;
    ViewController($scope, $location, applicationState, Choko);
  }
}
//PanelController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function NavigationController($scope, $location) {
  $scope.navigation = {
    title: 'MyApp',
    links: [
      {
        title: 'Home',
        description: 'Go to the homepage',
        path: '/home'
      },
      {
        title: 'Other link',
        path: '/other-link'
      }
    ]
  };
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

  $scope.isActive = function(route) {
    //var regexp = new RegExp('^' + pattern + '.*$', ["i"]);
    return route === $location.path();
  };
}
//NavigationController.$inject = ['$scope', '$location'];

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
