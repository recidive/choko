var async = require('async');

var display = module.exports;

/**
 * The type() hook.
 */
display.type = function(types, callback) {
  var newTypes = {};

  newTypes['listStyle'] = {
    title: 'List style',
    description: 'List styles format the list wrapper. It can be a table, a list, a galery, a graph or a map.',
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
      'list': 'manage-displays',
      'load': true,
      'add': 'manage-displays',
      'edit': 'manage-displays',
      'delete': 'manage-displays'
    }
  };

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
    },
    displays: {
      'list-group-item': {
        'heading': [{
          fieldName: 'title',
          format: 'title',
          weight: 0
        }],
        'text': [{
          fieldName: 'description',
          format: 'paragraph',
          weight: 5
        }]
      }
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

/**
 * The display() hook.
 */
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

/**
 * The listStyle() hook.
 */
display.listStyle = function(listStyles, callback) {
  var newStyles = {};

  newStyles['unformatted'] = {
    title: 'Unformatted list',
    displayModes: ['custom', 'media']
  };

  newStyles['unordered'] = {
    title: 'Unordered list',
    displayModes: ['list-item']
  };

  newStyles['ordered'] = {
    title: 'Ordered list',
    displayModes: ['list-item']
  };

  newStyles['list-group'] = {
    title: 'List group',
    displayModes: ['list-group-item']
  };

  newStyles['thumbnails'] = {
    title: 'Thumbnails',
    displayModes: ['thumbnail', 'custom', 'media']
  };

  callback(null, newStyles);
};
