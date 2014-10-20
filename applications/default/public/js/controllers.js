'use strict';

angular.module('choko.controllers', [])

  .controller('ApplicationController', ['$scope', '$location', '$http', 'applicationState',
    function ($scope, $location, $http, applicationState) {
      $scope.state = {};

      $scope.changeState = function() {
        var path = (!$location.path() || $location.path() == '/') ? '/home' : $location.path();

        $http.get(path)
        .success(function(data, status, headers, config) {
          if (data.data.redirect) {
            // Server returned a redirect.
            return $location.path(data.data.redirect);
          }

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
        })
        .error(function(data, status, headers, config) {
          // Merge data from the server.
          angular.extend($scope.page, data.data);

          $scope.page.template = '/templates/error.html';

          // Store scope as application state.
          applicationState.set($scope);
        });
      }

      $scope.$watch(function() {
        return $location.path();
      }, function(){
        $scope.changeState();
      });
    }])

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
    }])

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

    }])

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
    }])

  .controller('ItemController', ['$scope',
    function ($scope) {

    }])

  .controller('DisplayRegionController', ['$scope',
    function ($scope) {

    }])

  .controller('DisplayFieldController', ['$scope',
    function ($scope) {
      $scope.field.template = $scope.field.template || '/templates/' + $scope.field.format + '.html';
    }])

  .controller('ViewController', ['$scope', '$location', '$http', 'Choko', 'Params',
    function ($scope, $location, $http, Choko, Params) {

      // Parse parameters when needed.
      if (typeof $scope.view.itemKey !== 'undefined') {
        $scope.view.itemKey = Params.parse($scope.view.itemKey, $scope);
      }

      // Parse other params.
      Object.keys($scope.view.query || {}).forEach(function (param) {
        $scope.view.query[param] = Params.parse($scope.view.query[param], $scope);
      });

      // Handle 'list' type views.
      if ($scope.view.type === 'list' && $scope.view.itemType) {
        var query = {
          type: $scope.view.itemType
        };

        if ($scope.view.query) {
          angular.extend(query, $scope.view.query);
        }

        $scope.items = {};

        Choko.get(query, function(response) {
          $scope.items = response;
        });

        if (!$scope.view.template && $scope.view.listStyle) {
          $scope.view.template = '/templates/' + $scope.view.listStyle + '.html';
        }

        if (!$scope.view.itemTemplate && $scope.view.itemDisplay) {
          Choko.get({type: 'display', key: $scope.view.itemDisplay}, function(display) {
            $scope.display = display;
            if (display.layout) {
              Choko.get({type: 'displayLayout', key: display.layout}, function(layout) {
                $scope.layout = layout;
                $scope.view.itemTemplate = '/templates/display-layout.html';
              });
            }
          });
        }
      }

      // Handle 'item' type views.
      if ($scope.view.type === 'item' && $scope.view.itemType) {
        $scope.data = {};
        $scope.view.title = '';
        Choko.get({type: $scope.view.itemType, key: $scope.view.itemKey}, function(response) {
          $scope.data = response;
          $scope.view.title = response.title;
        },
        function(response) {
          // Error.
          if ($scope.page) {
            // If it's a page, show error, otherwise fail silently.
            $scope.data = response.data;
            $scope.view.title = response.data.title;
            $scope.view.template = '/templates/error.html';
          }
        });
      }

      // Handle 'form' type views.
      if ($scope.view.type === 'form' && $scope.view.formName) {
        $scope.data = {};

        if ($scope.view.itemType && $scope.view.itemKey) {
          Choko.get({type: $scope.view.itemType, key: $scope.view.itemKey}, function(response) {
            $scope.data = response;
          });
        }

        $scope.submit = function(url, redirect) {
          // Add itemKey to the URL if any.
          if ($scope.view.itemKey) {
            url += '/' + $scope.view.itemKey;
          }

          $http.post(url, $scope.data)
            .success(function(data, status, headers, config) {
              $scope.data = data;
              delete $scope.errors;
              if (redirect) {
                $location.path(redirect);
              }
            })
            .error(function(data, status, headers, config) {
              $scope.status = status;
              $scope.errors = data.data;
            });
        };

        Choko.get({type: 'form', key: $scope.view.formName}, function(response) {
          $scope.form = response;

          if ($scope.form.mainTypeName) {
            $scope.data.type = $scope.form.shortName;
          }

          // First we look for view (page/panel) redirect, then for form redirect.
          // The submit button will first look for a property of its own and
          // fallback to this.
          $scope.form.redirect = $scope.view.redirect || $scope.form.redirect || null;

          $scope.view.template = $scope.view.template || $scope.form.template;
          $scope.view.template = $scope.view.template || '/templates/form.html';
        });
      }
    }])
