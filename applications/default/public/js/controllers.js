'use strict';

function ApplicationController($scope, $location, $http, applicationState, Choko) {
  $scope.state = {};

  $scope.changeState = function() {
    var path = (!$location.path() || $location.path() == '/') ? '/home' : $location.path();

    $http.get(path).success(function(data) {
      // Rebuild the layout only when context changes.
      if ($scope.contexts instanceof Array && $scope.contexts.toString() == data.data.contexts.toString()) {
        // Update only panels in content region, and page information.
        // @todo: get the region the page-content panel is attached to
        // dinamically currently this is hadcoded to 'content' and will not work
        // if the page-content panel is attacehd to a different region.
        $scope.panels['content'] = data.data.panels['content'];
        $scope.page = data.data.page;
      }
      else {
        // Merge data from the server.
        angular.extend($scope, data.data);

        // Store scope as application state.
        applicationState.set($scope);
      }
    });
  }

  $scope.$watch(function() {
    return $location.path();
  }, function(){
    $scope.changeState();
  });
}
//ApplicationController.$inject = ['$scope', '$location', '$http', 'applicationState', 'Choko'];

function PanelController($scope, $location, $http, applicationState, Choko) {
  if ($scope.panel.type && $scope.panel.type !== 'default') {
    // Set view to the panel itself and call ViewController.
    $scope.view = $scope.panel;
    ViewController($scope, $location, $http, applicationState, Choko);
  }

  if ($scope.panel.bare) {
    $scope.template = $scope.panel.template || 'templates/panel-content.html';
  }
  else {
    $scope.template = 'templates/panel.html';
  }
}
//PanelController.$inject = ['$scope', '$location', '$http', 'applicationState', 'Choko'];

function PageController($scope, $location, $http, applicationState, Choko) {
  if (!$scope.page.type || $scope.page.type === 'default') {
    $scope.items = $scope.page.items || {};
    $scope.title = $scope.page.title;
  }
  else {
    // Set view to the panel itself and call ViewController.
    $scope.view = $scope.page;
    ViewController($scope, $location, $http, applicationState, Choko);
  }
}
//PageController.$inject = ['$scope', '$location', '$http', 'applicationState', 'Choko'];

function RowController($scope, $location, applicationState, Choko) {
  $scope.name = $scope.row.name;

  $scope.getTemplate = function() {
    return $scope.template || 'templates/row.html';
  }
}
//RowController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function ColumnController($scope, $location, applicationState, Choko) {
  $scope.name = $scope.column.name;

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

function ItemController($scope, $location, applicationState, Choko) {
}
//ItemController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function ViewController($scope, $location, $http, applicationState, Choko) {
  // Handle 'list' type views.
  if ($scope.view.type === 'list' && $scope.view.itemType) {
    $scope.items = {};

    Choko.get({type: $scope.view.itemType}, function(response) {
      $scope.title = $scope.page.title;
      $scope.items = response;
    });
  }

  // Handle 'item' type views.
  if ($scope.view.type === 'item' && $scope.view.itemType) {
    $scope.item = {};

    Choko.get({type: $scope.view.itemType, key: $scope.view.itemKey}, function(response) {
      if ($scope.view.path) {
        $scope.title = response.title;
      }
      $scope.item = response;
    });
  }

  // Handle 'form' type views.
  if ($scope.view.type === 'form' && $scope.view.formName) {
    $scope.data = {};

    $scope.submit = function(url) {
      $http.post(url, $scope.data)
        .success(function(data, status, headers, config) {
          $scope.data = data;
          $location.path('/');
        })
        .error(function(data, status, headers, config) {
          $scope.status = status;
        });
    };

    Choko.get({type: 'form', key: $scope.view.formName}, function(response) {
      if ($scope.view.path) {
        $scope.title = response.title;
      }
      $scope.form = response;
      $scope.view.template = $scope.view.template || $scope.form.template;
      $scope.view.template = $scope.view.template || 'templates/form.html';
    });
  }
}
//ViewController.$inject = ['$scope', '$location', '$http', 'applicationState', 'Choko'];

function ElementController($scope, $location, applicationState, Choko) {
  $scope.element.template = $scope.element.template || 'templates/' + $scope.element.type + '.html';
}
//ElementController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];
