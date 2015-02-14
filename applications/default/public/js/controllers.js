'use strict';

/**
 * @file Choko core controllers.
 */

angular.module('choko')

  .controller('ApplicationController', ['$rootScope', '$location', '$http', 'applicationState',
    function ($rootScope, $location, $http, applicationState) {
      // Store scope as application state.
      applicationState.set($rootScope);

      $rootScope.changeState = function() {
        var path = (!$location.path() || $location.path() == '/') ? '/home' : $location.path();

        $http.get(path)
        .success(function(data, status, headers, config) {
          if (data.data.redirect) {
            // Server returned a redirect.
            return $location.path(data.data.redirect);
          }

          // If contexts didn't change we just need to update main page content.
          if ($rootScope.contexts instanceof Array && angular.equals($rootScope.contexts, data.data.contexts)) {
            // Update only panels in content region, and page information.
            // @todo: get the region the page-content panel is attached to
            // dinamically currently this is hadcoded to 'content' and will not work
            // if the page-content panel is attacehd to a different region.
            $rootScope.panels['content'] = data.data.panels['content'];

            // Set page data.
            $rootScope.page = data.data.page;
          }
          else {
            // We only set everything on scope if it's the first page being
            // loaded or if the theme or the layout has changed, to avoid some
            // glitches.
            var needsRebuild = !('page' in $rootScope) ||
              ('theme' in $rootScope && $rootScope.theme.name != data.data.theme.name) ||
              ('layout' in $rootScope && $rootScope.layout.name != data.data.layout.name);

            if (needsRebuild) {
              // Merge all data from the server.
              angular.extend($rootScope, data.data);
            }
            else {
              // Selectivelly merge data from the server.
              Object.keys(data.data).forEach(function(propName) {
                if (['theme', 'layout', 'panels'].indexOf(propName) === -1) {
                  $rootScope[propName] = data.data[propName];
                }
              });

              // Selectivelly add/remove panels.
              if ('panels' in data.data) {
                // Merge existing regions.
                Object.keys($rootScope.panels).forEach(function(regionName) {
                  if (regionName in data.data.panels) {
                    $rootScope.mergePanels($rootScope.panels[regionName], data.data.panels[regionName]);
                  }
                  else {
                    // Remove region.
                    delete $rootScope.panels[regionName];
                  }
                });

                // Add new regions.
                Object.keys(data.data.panels).forEach(function(regionName) {
                  // Also update panels in content region, and page information.
                  // @todo: get the region the page-content panel is attached to
                  // dinamically currently this is hadcoded to 'content' and will not work
                  // if the page-content panel is attacehd to a different region.
                  if (!(regionName in $rootScope.panels) || regionName == 'content') {
                    $rootScope.panels[regionName] = data.data.panels[regionName];
                  }
                });
              }
            }
          }
        })
        .error(function(data, status, headers, config) {
          // Merge data from the server.
          $rootScope.page = $rootScope.page || {};
          angular.extend($rootScope.page, data.data);

          $rootScope.page.template = '/templates/error.html';
        });
      };

      $rootScope.mergePanels = function(panelsTo, panelsFrom) {
        // First remove items on first array that are not on the second one.
        panelsTo.forEach(function(panel) {
          // @todo: allow invalidating panel states.
          if ($rootScope.indexOfPanel(panelsFrom, panel.name) === -1) {
            panelsTo.splice($rootScope.indexOfPanel(panelsTo, panel.name), 1);
          }
        });

        // If the number of items of the resulting array is equal to the second one
        // there's nothing to add.
        if (panelsTo.length === panelsFrom.length) {
          return panelsTo;
        }

        // Add new panels.
        panelsFrom.forEach(function(panel) {
          if ($rootScope.indexOfPanel(panelsTo, panel.name) === -1) {
            panelsTo.push(panel);
          }
        });

        return panelsTo;
      };

      $rootScope.indexOfPanel = function(panels, panelName) {
        var index = -1;
        panels.forEach(function(panel, panelIndex) {
          if (panel.name == panelName) {
            index = panelIndex;
          }
        });
        return index;
      };

      $rootScope.$watch(function() {
        return $location.path();
      },
      function() {
        $rootScope.changeState();
      });
    }])

  .controller('ItemController', ['$scope',
    function ($scope) {

    }])

  .controller('ViewController', ['$scope', '$location', '$http', 'Choko', 'Params', 'Token',
    function ($scope, $location, $http, Choko, Params, Token) {

      $scope.prepareDisplay = function(name, callback) {
        Choko.get({type: 'display', key: name}, function(display) {
          $scope.display = display;
          if (display.layout) {
            Choko.get({type: 'displayLayout', key: display.layout}, function(layout) {
              $scope.layout = layout;
              $scope.view.itemTemplate = '/templates/display-layout.html';
              callback();
            });
          }
          else {
            callback();
          }
        });
      };

      // Parse parameters when needed.
      if (typeof $scope.view.itemKey !== 'undefined') {
        $scope.view.itemKey = Params.parse($scope.view.itemKey, $scope);
      }

      // Parse other params.
      Object.keys($scope.view.query || {}).forEach(function (param) {
        $scope.view.query[param] = Params.parse($scope.view.query[param], $scope);
      });

      // Replace tokens in title.
      if ($scope.view.title) {
        $scope.view.title = Token.replace($scope.view.title, $scope);
      }

      // Handle 'list' type views.
      if ($scope.view.type === 'list' && $scope.view.itemType) {
        var query = {
          type: $scope.view.itemType
        };

        if ($scope.view.query) {
          angular.extend(query, $scope.view.query);
        }

        $scope.items = {};

        if ($scope.view.template) {
          Choko.get(query, function(response) {
            $scope.items = response;
          });
        }

        if (!$scope.view.template && $scope.view.listStyle) {
          $scope.view.template = '/templates/' + $scope.view.listStyle + '.html';
        }

        if (!$scope.view.itemTemplate && $scope.view.itemDisplay) {
          $scope.prepareDisplay($scope.view.itemDisplay, function() {
            Choko.get(query, function(response) {
              $scope.items = response;
            });
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
        $scope.buildForm = function () {
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
            $scope.buildForm();
          });
        }
        else {
          $scope.buildForm();
        }

        $scope.submit = function(url) {
          // Add itemKey to the URL if any.
          if ($scope.view.itemKey) {
            url += '/' + $scope.view.itemKey;
          }

          $http.post(url, $scope.data)
            .success(function(data, status, headers, config) {
              $scope.data = data.data;

              delete $scope.errors;

              if ($scope.form.redirect) {
                // Replace tokens in redirects. Make 'item' an alias to 'data'
                // so item parser can be used in tokens.
                $scope.item = $scope.data;
                $scope.form.redirect = Token.replace($scope.form.redirect, $scope);

                $location.path($scope.form.redirect);
              }
            })
            .error(function(data, status, headers, config) {
              $scope.status = status;
              $scope.errors = data.data;
            });
        };
      }
    }]);
