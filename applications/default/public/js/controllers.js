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
          if (data.redirect) {
            // Server returned a redirect.
            return $location.path(data.redirect);
          }

          // If contexts didn't change we just need to update main page content.
          if ($rootScope.contexts instanceof Array && angular.equals($rootScope.contexts, data.contexts)) {
            // Update only panels in content region, and page information.
            // @todo: get the region the page-content panel is attached to
            // dinamically currently this is hadcoded to 'content' and will not work
            // if the page-content panel is attacehd to a different region.
            $rootScope.panels['content'] = data.panels['content'];

            // Set page data.
            $rootScope.page = data.page;
          }
          else {
            // We only set everything on scope if it's the first page being
            // loaded or if the theme or the layout has changed, to avoid some
            // glitches.
            var needsRebuild = !('page' in $rootScope) ||
              ('theme' in $rootScope && $rootScope.theme.name != data.theme.name) ||
              ('layout' in $rootScope && $rootScope.layout.name != data.layout.name);

            if (needsRebuild) {
              // Merge all data from the server.
              angular.extend($rootScope, data);
            }
            else {
              // Selectivelly merge data from the server.
              Object.keys(data).forEach(function(propName) {
                if (['theme', 'layout', 'panels'].indexOf(propName) === -1) {
                  $rootScope[propName] = data[propName];
                }
              });

              // Selectivelly add/remove panels.
              if ('panels' in data) {
                // Merge existing regions.
                Object.keys($rootScope.panels).forEach(function(regionName) {
                  if (regionName in data.panels) {
                    $rootScope.mergePanels($rootScope.panels[regionName], data.panels[regionName]);
                  }
                  else {
                    // Remove region.
                    delete $rootScope.panels[regionName];
                  }
                });

                // Add new regions.
                Object.keys(data.panels).forEach(function(regionName) {
                  // Also update panels in content region, and page information.
                  // @todo: get the region the page-content panel is attached to
                  // dinamically currently this is hadcoded to 'content' and will not work
                  // if the page-content panel is attacehd to a different region.
                  if (!(regionName in $rootScope.panels) || regionName == 'content') {
                    $rootScope.panels[regionName] = data.panels[regionName];
                  }
                });
              }
            }
          }
        })
        .error(function(data, status, headers, config) {
          // Merge data from the server.
          $rootScope.page = $rootScope.page || {};
          angular.extend($rootScope.page, data);

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

  .controller('ViewController', ['$scope', '$location', '$http', 'Choko', 'Params', 'Token', 'Restangular',
    function ($scope, $location, $http, Choko, Params, Token, Restangular) {

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


      // Prevente creation of service if no itemType set.
      if ($scope.view.itemType) {
        // Create a new Service for Itemtype.
        var itemTypeREST = Restangular.service($scope.view.itemType);
      }

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
        var query = {};

        if ($scope.view.query) {
          angular.extend(query, $scope.view.query);
        }

        if ($scope.view.template) {
          Choko.get(query, function(response) {
            $scope.items = response;
          });
        }

        // Expose view list promise to scope
        $scope.viewList = itemTypeREST.getList(query);
        $scope.items = {};

        $scope.viewList.then(function(response) {
          $scope.items = response;
        });

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

        // Expose variables to the scope
        $scope.data = {};
        $scope.view.title = '';
        $scope.viewItem = itemTypeREST.one($scope.view.itemKey).get();

        $scope.viewItem.then(function(response) {
          $scope.data = response;
          $scope.view.title = response.title;
        }, function(response) {
          // Error.
          if ($scope.page) {
            // If it's a page, show error, otherwise fail silently.
            $scope.data = response;
            $scope.view.title = response.title;
            $scope.view.template = '/templates/error.html';
          }
        });
      }

      // Handle 'form' type views.
      if ($scope.view.type === 'form' && $scope.view.formName) {
        var typeForm = 'post';
        var itemREST = null;

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

          // Set type form to PUT.
          typeForm = 'put';

          itemTypeREST.one($scope.view.itemKey)
            .get()
            .then(function(response) {
              $scope.data = response;
              $scope.buildForm();
            });
        }

        // Verify if the form is the type PUT to build the form
        if (typeForm != 'put') {
          $scope.buildForm();
        }

        $scope.submit = function(url) {

          // Replace tokens in url.
          if (url) {
            url = Token.replace(url, $scope);
          }

          // Add params to data if any.
          Object.keys($scope.view.params || {}).forEach(function(param) {
            $scope.data[param] = $scope.data[param] || $scope.view.params[param];
          });

          if(!itemTypeREST) {
            $scope.viewForm = Restangular.oneUrl('url', url).post('', $scope.data);
          }
          else {
            if (url) {
              $scope.viewForm = Restangular.oneUrl('url', url).post('', $scope.data);
            } else {
              $scope.viewForm = typeForm === 'post' ?
              itemTypeREST.post($scope.data) :
              $scope.data.put();
            }
          }

          $scope.viewForm.then(function(response) {
            $scope.data = response;
            delete $scope.errors;

            if ($scope.form.redirect) {
              // Replace tokens in redirects. Make 'item' an alias to 'data'
              // so item parser can be used in tokens.
              $scope.item = $scope.data;
              $scope.form.redirect = Token.replace($scope.form.redirect, $scope);

              $location.path($scope.form.redirect);
            }
          }, function(response) {
            $scope.status = response.status;
            $scope.errors = response.data;
          });
        }
      }
    }]);
