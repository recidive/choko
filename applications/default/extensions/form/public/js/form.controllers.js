'use strict';

/**
 * @file Form extension controllers.
 */

angular.module('choko')

.controller('FormController', ['$scope',
  function ($scope) {
    $scope.form.id = $scope.form.id || 'form-' + $scope.form.name;
  }])

.controller('ElementController', ['$scope',
  function ($scope) {
    $scope.element.template = $scope.element.template || '/templates/' + $scope.element.type + '.html';
    $scope.element.id = $scope.element.id || 'element-' + $scope.form.name + '-' + $scope.element.name;
  }])

.controller('FileElementController', ['$scope', '$controller', 'Upload',
  function ($scope, $controller, Upload) {
    // Inherit ElementController.
    $controller('ElementController', {
      $scope: $scope
    });

    $scope.progress = 0;

    // Initialize files container.
    // @todo support multiple files.
    if ($scope.data[$scope.element.name] && $scope.data[$scope.element.name] instanceof Object) {
      $scope.data[$scope.element.name] =  $scope.data[$scope.element.name].id;
    }
    else {
      $scope.data[$scope.element.name] =  null;
    }

    $scope.onFileSelect = function($files) {
      for (var i = 0; i < $files.length; i++) {
        var file = $files[i];
        $scope.upload = Upload.upload({
          url: '/file',
          file: file
        })
        .progress(function(evt) {
          $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
        })
        .success(function(data, status, headers, config) {
          $scope.data[$scope.element.name] = data.id;
        });
      }
    };
  }])

.controller('FormButtonController', ['$scope', '$controller',
  function ($scope, $controller) {
    // Inherit ElementController.
    $controller('ElementController', {
      $scope: $scope
    });

    $scope.call = function(func, args) {
      $scope[func].apply(this, args);
    };
  }])

.controller('WYSIWYGController', ['$scope',
  function ($scope) {
    $scope.options = {
      height: $scope.element.height || 300,
      toolbar: [
        ['style', ['style']],
        ['style', ['bold', 'italic', 'underline', 'clear']],
        ['para', ['ul', 'ol', 'paragraph']],
        ['insert', ['picture', 'video', 'link']],
        ['table', ['table']]
      ]
    };
  }])

.controller('ReferenceElementController', ['$scope', '$controller', 'Choko',
  function ($scope, $controller, Choko) {
    // Inherit ElementController.
    $controller('ElementController', {
      $scope: $scope
    });

    var query = {
      type: $scope.element.reference.type
    };

    // Add element defined query.
    if ($scope.element.reference.query) {
      angular.extend(query, $scope.element.reference.query);
    }

    // Get reference items to make a options list.
    Choko.get(query, function(response) {
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
  }])

.controller('InlineReferenceElementController', ['$scope', '$controller', 'Choko',
  function ($scope, $controller, Choko) {
    // Inherit ElementController.
    $controller('ElementController', {
      $scope: $scope
    });

    var multiple = $scope.element.reference.multiple;

    // Subform errors are handled separately.
    $scope.errors = null;

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
  }])

.controller('InlineReferenceElementItemController', ['$scope',
  function ($scope) {

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
  }])
