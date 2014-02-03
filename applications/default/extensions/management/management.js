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
  var self= this;
  var newPages = {};

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
 * The context() hook.
 */
management.context = function(contexts, callback) {
  var newContexts = {};

  newContexts['manage'] = {
    title: 'Management pages',
    description: 'Management pages context.',
    weight: -1,
    conditions: {
      path: ['/manage', '/manage/*']
    },
    reactions: {
      theme: 'default',
      layout: 'two-columns-3-9',
      panel: {
        'sidebar': [{
          name: 'navigation-manage',
          weight: 0
        }]
      }
    }
  };
  newContexts['manage-users'] = {
    title: 'User management pages',
    description: 'User management pages context.',
    weight: -1,
    conditions: {
      path: ['/manage/users', '/manage/users/*']
    },
    reactions: {
      panel: {
        'content': [{
          name: 'navigation-user-management-tabs',
          weight: -1
        }],
        'navigation-user-management-tabs': [{
          name: 'navigation-user-management-toolbar',
          weight: 0
        }]
      }
    }
  };
  newContexts['manage-navigation'] = {
    title: 'Navigaiton management pages',
    description: 'Navigation management pages context.',
    weight: -1,
    conditions: {
      path: ['/manage/navigations', '/manage/navigations/*']
    },
    reactions: {
      panel: {
        'page-header': [{
          name: 'navigation-navigation-management-toolbar',
          weight: 0
        }]
      }
    }
  };
  newContexts['manager'] = {
    title: 'Manager user',
    description: 'Context for users that can access management pages.',
    weight: -1,
    conditions: {
      access: 'manage-application'
    },
    reactions: {
      panel: {
        'navbar-right': [{
          name: 'manage-button',
          weight: -1
        }]
      }
    }
  };

  callback(null, newContexts);
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
