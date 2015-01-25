'use strict';

/**
 * @file Choko core controllers.
 */

angular.module('choko')

  .controller('ApplicationController', ['$rootScope', '$location', '$http', 'applicationState',
    function ($rootScope, $location, $http, applicationState) {
      $rootScope.state = {};

      $rootScope.changeState = function() {
        var path = (!$location.path() || $location.path() == '/') ? '/home' : $location.path();

        $http.get(path)
        .success(function(data, status, headers, config) {
          if (data.data.redirect) {
            // Server returned a redirect.
            return $location.path(data.data.redirect);
          }

          // Rebuild the layout only when context changes.
          if ($rootScope.contexts instanceof Array && $rootScope.contexts.toString() == data.data.contexts.toString()) {
            // Update only panels in content region, and page information.
            // @todo: get the region the page-content panel is attached to
            // dinamically currently this is hadcoded to 'content' and will not work
            // if the page-content panel is attacehd to a different region.
            $rootScope.panels['content'] = data.data.panels['content'];
            $rootScope.page = data.data.page;
          }
          else {
            // Merge data from the server.
            angular.extend($rootScope, data.data);

            // Store scope as application state.
            applicationState.set($rootScope);
          }
        })
        .error(function(data, status, headers, config) {
          // Merge data from the server.
          angular.extend($rootScope.page, data.data);

          $rootScope.page.template = '/templates/error.html';

          // Store scope as application state.
          applicationState.set($rootScope);
        });
      }

      $rootScope.$watch(function() {
        return $location.path();
      }, function(){
        $rootScope.changeState();
      });
    }])

  .controller('ItemController', ['$scope',
    function ($scope) {

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
        $scope.buildChokoForm = function () {
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
        };

        if ($scope.view.itemType && $scope.view.itemKey) {
          // Load item for editing.
          Choko.get({type: $scope.view.itemType, key: $scope.view.itemKey}, function(response) {
            $scope.data = response;
            $scope.buildChokoForm();
          });
        }
        else {
          $scope.buildChokoForm();
        }

        $scope.submit = function(url, redirect) {
          // Add itemKey to the URL if any.
          if ($scope.view.itemKey) {
            url += '/' + $scope.view.itemKey;
          }

          $http.post(url, $scope.data)
            .success(function(data, status, headers, config) {
              $scope.data = data.data;
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
      }
    }]);
