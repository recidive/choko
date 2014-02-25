var fs = require('fs');
var path = require('path');
var utils = require('prana').utils;

/*
 * The Application Management extension.
 */

var management = module.exports;

/**
 * The permission() hook.
 */
management.permission = function(permissions, callback) {
  var newPermissions = {};

  newPermissions['manage-application'] = {
    title: 'Manage application',
    description: 'Access application managemnt pages.'
  };

  callback(null, newPermissions);
};

/**
 * The page() hook.
 */
management.page = function(pages, callback) {
  var self = this;
  var newPages = {};

  // Create form pages for all page subtypes.
  var pageTypes = this.application.type('page').subtypes;
  for (var subtypeName in pageTypes) {
    var subtypeSettings = pageTypes[subtypeName].type.settings;
    newPages['manage-pages-add-' + subtypeSettings.name] = {
      path: '/manage/pages/add-' + subtypeSettings.name,
      title: 'Add ' + subtypeSettings.title.toLowerCase(),
      type: 'form',
      formName: 'type-' + subtypeSettings.name + 'Page',
      redirect: '/manage/pages'
    };
  }

  // Create form panels for all panels subtypes.
  var panelTypes = this.application.type('panel').subtypes;
  for (var subtypeName in panelTypes) {
    var subtypeSettings = panelTypes[subtypeName].type.settings;
    newPages['manage-panels-add-' + subtypeSettings.name] = {
      path: '/manage/panels/add-' + subtypeSettings.name,
      title: 'Add ' + subtypeSettings.title.toLowerCase(),
      type: 'form',
      formName: 'type-' + subtypeSettings.name + 'Panel'
    };
  }

  newPages['manage-types'] = {
    path: '/manage/types',
    title: 'Types',
    subtitle: 'Resource types',
    description: 'Types can be everything from application metadata to media objects.',
    access: 'manage-types',
    callback: function(request, response, callback) {
      var types = self.application.types;
      var result = {};
      for (var typeName in types) {
        var type = types[typeName];
        result[typeName] = {
          title: type.type.settings.title,
          description: type.type.settings.description
        };
      }
      response.payload.page.items = result;
      callback();
    },
    template: 'templates/list-group.html'
  };

  newPages['manage-extensions'] = {
    path: '/manage/extensions',
    title: 'Extensions',
    subtitle: 'The building blocks',
    description: 'Extensions are groups of functionality.',
    access: 'manage-extensions',
    callback: function(request, response, callback) {
      var extensions = self.application.extensions;
      var result = {};
      for (var extensionName in extensions) {
        var extension = extensions[extensionName];
        result[extensionName] = {
          title: extension.settings.title,
          description: extension.settings.description
        };
      }
      response.payload.page.items = result;
      callback();
    },
    template: 'templates/list-group.html'
  };

  callback(null, newPages);
};

/**
 * The navigation() hook.
 */
management.navigation = function(navigations, callback) {
  var newNavigations = {};

  // Create navigation dropdown with links for all page types form.
  var pageTypes = this.application.type('page').subtypes;
  var items = [];
  for (var subtypeName in pageTypes) {
    var subtypeSettings = pageTypes[subtypeName].type.settings;
    items.push({
      title: subtypeSettings.title,
      url: '/manage/pages/add-' + subtypeSettings.name
    });
  }
  newNavigations['page-management-toolbar'] = {
    title: 'Page management toolbar',
    template: '/templates/btn-group.html',
    classes: [
      'btn-group-sm'
    ],
    items: [
      {
        type: 'dropdown',
        title: 'Add',
        items: items,
        classes: [
          'btn-primary'
        ]
      }
    ]
  };


  // Create navigation dropdown with links for all panel types form.
  var panelTypes = this.application.type('panel').subtypes;
  var items = [];
  for (var subtypeName in panelTypes) {
    var subtypeSettings = panelTypes[subtypeName].type.settings;
    items.push({
      title: subtypeSettings.title,
      url: '/manage/panels/add-' + subtypeSettings.name
    });
  }
  newNavigations['panel-management-toolbar'] = {
    title: 'Panel management toolbar',
    template: '/templates/btn-group.html',
    classes: [
      'btn-group-sm'
    ],
    items: [
      {
        type: 'dropdown',
        title: 'Add',
        items: items,
        classes: [
          'btn-primary'
        ]
      }
    ]
  };

  callback(null, newNavigations);
};

/**
 * The save() hook.
 */
management.save = function(type, data, callback) {
  if (type.settings.storage != 'memory') {
    return callback(null, data);
  }

  var saveToFile = function(filePath, data, callback) {
    fs.writeFile(filePath, JSON.stringify(data, null, '  '), function(error) {
      if (error) {
        return callback(error);
      }
      callback(null, data);
    });
  };

  var overridesDir = path.join(this.application.settings.applicationDir, 'overrides', type.name);

  fs.exists(overridesDir, function(exists) {
    var filePath = path.join(overridesDir, data[type.settings.keyProperty] + '.' + type.name + '.json');

    if (exists) {
      saveToFile(filePath, data, callback);
    }
    else {
      utils.mkdir(overridesDir, function(error) {
        if (error) {
          return callback(error);
        }
        saveToFile(filePath, data, callback);
      });
    }
  });
};

/**
 * The list() hook.
 */
management.list = function(type, data, callback) {
  // @todo: this is certainly not the best place to do this since it will make
  // overrides depend on the management extension. It seems ok for now that
  // management is a required extension.
  this.application.overrides(type, data, callback);
};
