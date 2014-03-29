var layout = module.exports;

/**
 * The permission() hook.
 */
layout.permission = function(permissions, callback) {
  var newPermissions = {};

  newPermissions['manage-layouts'] = {
    title: 'Manage layouts',
    description: 'List, create and edit layouts.'
  };

  callback(null, newPermissions);
};

/**
 * The type() hook.
 */
layout.type = function(types, callback) {
  var newTypes = {};

  newTypes['layout'] = {
    title: 'Layout',
    description: 'Layout defines page structure.',
    access: {
      'list': true,
      'load': true,
      'add': 'manage-layouts',
      'edit': 'manage-layouts',
      'delete': 'manage-layouts'
    }
  };

  callback(null, newTypes);
};

/**
 * The contextReactionType() hook.
 */
layout.contextReactionType = function(reactionTypes, callback) {
  var self = this;
  var newReactionTypes = {};

  newReactionTypes['layout'] = {
    title: 'Set layout',
    description: 'Set the layout.',
    standalone: false,
    fields: {
      layout: {
        title: 'Layout',
        description: 'Layout to set to.',
        type: 'reference',
        reference: {
          type: 'layout'
        }
      }
    },
    react: function(request, response, value, callback) {
      var Layout = self.application.type('layout');
      Layout.load(value, function(err, layout) {
        if (err) {
          return callback(err);
        }

        if (layout) {
          response.payload.layout = layout;
        }
        callback();
      });
    }
  };

  callback(null, newReactionTypes);
};
