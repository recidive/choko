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

  // handle 'list' type panels.
  if ($scope.panel.type === 'list' && $scope.panel.itemType) {
    $scope.items = {};

    Choko.get({type: $scope.panel.itemType}, function(response) {
      $scope.items = response;
    });
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

  $scope.isActive = function(route) {
    //var regexp = new RegExp('^' + pattern + '.*$', ["i"]);
    return route === $location.path();
  };
}
//NavigationController.$inject = ['$scope', '$location'];
