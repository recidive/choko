var async = require('async');

var display = module.exports;

/**
 * The type() hook.
 */
display.type = function(types, callback) {
  var newTypes = {};

  newTypes['display'] = {
    title: 'Display',
    description: 'Displays.',
    fields: {
      name: {
        title: 'Name',
        type: 'text',
        required: true
      },
      title: {
        title: 'Title',
        type: 'text',
        required: true
      },
      layout: {
        title: 'Layout',
        type: 'reference',
        reference: {
          type: 'displayLayout'
        }
      }
    },
    access: {
      'list': 'manage-displays',
      'load': true,
      'add': 'manage-displays',
      'edit': 'manage-displays',
      'delete': 'manage-displays'
    }
  };

  newTypes['displayLayout'] = {
    title: 'Display layout',
    description: 'A layout to be used on displays.',
    fields: {
      name: {
        title: 'Name',
        type: 'text',
        required: true
      },
      title: {
        title: 'Title',
        type: 'text',
        required: true
      }
    },
    access: {
      'list': true,
      'load': true,
      'add': 'manage-displays',
      'edit': 'manage-displays',
      'delete': 'manage-displays'
    }
  };

  callback(null, newTypes);
};

display.display = function(displays, callback) {
  var types = this.application.types;
  // Add type display instances to display objects.
  async.each(Object.keys(types), function(typeName, next) {
    var typeSettings = types[typeName];
    if (typeSettings.displays) {
      for (var displayName in typeSettings.displays) {
        if (displayName in displays) {
          displays[displayName].instances = displays[displayName].instances || {};
          displays[displayName].instances[typeName] = typeSettings.displays[displayName];
        }
      }
    }
    next();
  }, function() {
    callback();
  });
};
