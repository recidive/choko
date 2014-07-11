'use strict';

function ApplicationController($scope, $location, $http, applicationState, Choko) {
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
  };
}
//ColumnController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function RegionController($scope, $location, applicationState, Choko) {
}
//RegionController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function NavigationController($scope, $location, $window, applicationState, Choko) {
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
}
//NavigationController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function ItemController($scope, $location, applicationState, Choko) {
}
//ItemController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function DisplayRegionController($scope, $location, applicationState, Choko) {
}
//DisplayRegionController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function DisplayFieldController($scope, $location, applicationState, Choko) {
  $scope.field.template = $scope.field.template || '/templates/' + $scope.field.format + '.html';
}
//DisplayFieldController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function ReferenceElementController($scope, $location, applicationState, Choko) {
  Choko.get({type: $scope.element.reference.type}, function(response) {
    $scope.element.options = response;

    // Use radios if less then 5 options.
    $scope.fewOptions = ($scope.element.options && Object.keys($scope.element.options).length <= 5);
  });

  // Initialize data container if needed.
  $scope.data[$scope.element.name] = $scope.data[$scope.element.name] || [];

  // Toggle selection for a given option by name.
  $scope.toggleSelection = function(option) {
    var index = $scope.data[$scope.element.name].indexOf(option);

    // Is currently selected.
    if (index > -1) {
      $scope.data[$scope.element.name].splice(index, 1);
    }
    // Is newly selected.
    else {
      $scope.data[$scope.element.name].push(option);
    }
  };
}
//ReferenceElementController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function InlineReferenceElementController($scope, $location, applicationState, Choko) {
  var multiple = $scope.element.reference.multiple;

  // Subform errors are handled separately.
  $scope.errors = [];

  if (multiple) {
    // Initialize items container.
    if ($scope.data[$scope.element.name]) {
      $scope.items = $scope.data[$scope.element.name];
    }
    else {
      $scope.items = $scope.data[$scope.element.name] = [];
    }

    // Initilize local data container.
    $scope.data = {};

    $scope.saveItem = function(key) {
      // @todo: validate item.
      // Add item and cleanup data container and items.
      if (key != undefined) {
        $scope.items[key] = $scope.data;
      }
      else {
        $scope.items.push($scope.data);
      }
      $scope.data = {};

      // Reset form to original state.
      delete $scope.element.subform;
    };

    $scope.removeItem = function(index) {
      $scope.items.splice(index, 1);
    };
  }
  else {
    if ($scope.data[$scope.element.name]) {
      $scope.data = $scope.data[$scope.element.name];
    }
    else {
      $scope.data = $scope.data[$scope.element.name] = {};
    }
  }

  $scope.setSubForm = function(type, sub, data, key) {
    // Start by destroying the subform and its data.
    // @todo: eventually we may want to add a confirmation, if form is "dirty".
    delete $scope.element.subform;
    $scope.data = {};

    // Get the new subform from the REST server.
    Choko.get({type: 'form', key: 'type-' + type}, function(response) {
      var subform = $scope.element.subform = response;

      // We are editing a item, store data.
      if (data) {
        $scope.editing = true;

        // Make a copy of original data for restoring on cancel.
        $scope.data = angular.copy(data);
      }
      else {
        $scope.editing = false;
      }

      if (multiple) {
        subform.elements.push({
          name: 'add',
          title: 'Save',
          type: 'button',
          click: 'saveItem',
          arguments: [key],
          classes: ['btn-default'],
          weight: 15
        });
        subform.elements.push({
          name: 'cancel',
          title: 'Cancel',
          type: 'button',
          click: 'cancel',
          classes: ['btn-link'],
          weight: 20
        });
      }

      if (sub) {
        // Set subform element type to subform short name.
        $scope.data.type = subform.shortName;
      }
    });
  };

  if (multiple) {
    if ($scope.element.reference.subtypes && $scope.element.reference.subtypes.length == 1) {
      $scope.setSubForm($scope.element.reference.subtypes[0]);
    }

    $scope.cancel = function() {
      delete $scope.element.subform;
      $scope.data = {};
    };
  }
  else {
    $scope.setSubForm($scope.element.reference.type);
  }

}
//InlineReferenceElementController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function InlineReferenceElementItemController($scope, $filter, applicationState, Choko) {

  $scope.editItem = function() {
    $scope.setSubForm($scope.typeName(), !!$scope.element.reference.subtypes, $scope.item, $scope.key);
  };

  $scope.typeName = function() {
    var typeName = $scope.element.reference.type;

    // If it has subtypes, i.e. it's a polymorphic type, get the actual type
    // being added to load the correct form.
    if ($scope.element.reference.subtypes) {
      $scope.element.reference.subtypes.forEach(function(subtype) {
        if (subtype.shortName == $scope.item.type) {
          typeName = subtype.name;
        }
      });
    }

    return typeName;
  };

}
//InlineReferenceElementItemController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function ViewController($scope, $location, $http, applicationState, Choko) {
  
  // Parse parameters when needed.
  if (typeof $scope.view.itemKey !== 'undefined') {
    $scope.view.itemKey = Params.parse($scope.view.itemKey, $scope);
  }

  // Parse other params.
  Object.keys($scope.view.params || {}).forEach(function (param) {
    $scope.view.params[param] = Params.parse($scope.view.params[param], $scope);
  });

  // Handle 'list' type views.
  if ($scope.view.type === 'list' && $scope.view.itemType) {
    $scope.items = {};

    Choko.get({type: $scope.view.itemType}, function(response) {
      $scope.items = response;
    });

    if (!$scope.view.template && $scope.view.listStyle) {
      $scope.view.template = '/templates/' + $scope.view.listStyle + '.html';
    }

    if (!$scope.view.itemTemplate && $scope.view.itemDisplay) {
      Choko.get({type: 'display', key: $scope.view.itemDisplay}, function(display) {
        $scope.display = display;
        Choko.get({type: 'displayLayout', key: display.layout}, function(layout) {
          $scope.layout = layout;
          $scope.view.itemTemplate = '/templates/display-layout.html';
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
      $scope.view.template = $scope.view.template || 'templates/form.html';
    });
  }
}
//ViewController.$inject = ['$scope', '$location', '$http', 'applicationState', 'Choko'];

function ElementController($scope, $location, applicationState, Choko) {
  $scope.element.template = $scope.element.template || 'templates/' + $scope.element.type + '.html';
}
//ElementController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function FileElementController($scope, $location, $upload, applicationState, Choko) {
  $scope.element.template = $scope.element.template || 'templates/' + $scope.element.type + '.html';
  $scope.progress = 0;

  // Initialize files container.
  // @todo support multiple files.
  $scope.data[$scope.element.name] = $scope.data[$scope.element.name] || null;

  $scope.onFileSelect = function($files) {
    for (var i = 0; i < $files.length; i++) {
      var file = $files[i];
      $scope.upload = $upload.upload({
        url: 'file',
        file: file
      })
      .progress(function(evt) {
        $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
      })
      .success(function(data, status, headers, config) {
        $scope.data[$scope.element.name] = data.data.id;
      });
    }
  };
}
//FileElementController.$inject = ['$scope', '$location', '$upload', 'applicationState', 'Choko'];

function SubElementController($scope, $location, applicationState, Choko) {
  $scope.subElement.template = $scope.subElement.template || 'templates/' + $scope.subElement.type + '.html';
}
//SubElementController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function ButtonController($scope, $location, applicationState, Choko) {
  $scope.call = function(func, args) {
    $scope[func].apply(this, args);
  };
}
//ButtonController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];

function WYSIWYGController($scope, $location, applicationState, Choko) {
  $scope.options = {
    height: $scope.element.height || 300,
    toolbar: [
      ['style', ['style']],
      ['style', ['bold', 'italic', 'underline', 'clear']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['insert', ['picture', 'link']],
      ['table', ['table']]
    ]
  };
}
//WYSIWYGController.$inject = ['$scope', '$location', 'applicationState', 'Choko'];
