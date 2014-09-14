/*
 * The theme extension.
 */

var theme = module.exports;

/**
 * The type() hook.
 */
theme.type = function(types, callback) {
  var newTypes = {};

  newTypes['theme'] = {
    title: 'Theme',
    description: 'Themes change application look & feel.',
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
      'list': 'manage-themes',
      'load': 'manage-themes',
      'add': 'manage-themes',
      'edit': 'manage-themes',
      'delete': 'manage-themes'
    }
  };

  callback(null, newTypes);
};

/**
 * The contextReactionType() hook.
 */
theme.contextReactionType = function(reactionTypes, callback) {
  var newReactionTypes = {};
  var application = this.application;

  newReactionTypes['theme'] = {
    title: 'Set theme',
    description: 'Chage application look & feel.',
    standalone: false,
    fields: {
      theme: {
        title: 'Theme',
        description: 'Theme to set to.',
        type: 'reference',
        reference: {
          type: 'theme'
        }
      }
    },
    react: function(request, response, value, callback) {
      application.load('theme', value, function(error, theme) {
        if (error) {
          return callback(error);
        }
        if (theme) {
          response.payload.theme = theme;
          callback();
        }
        else {
          // If theme is not found use the default theme.
          application.load('theme', 'default', function(error, theme) {
            if (error) {
              return callback(error);
            }
            response.payload.theme = theme;
            callback();
          });
        }
      });
    }
  };

  callback(null, newReactionTypes);
};
