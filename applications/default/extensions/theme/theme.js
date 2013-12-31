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
 * The reaction() hook.
 */
theme.reaction = function(reactions, callback) {
  var newReactions = {};
  var application = this.application;

  newReactions['theme'] = {
    title: 'Set theme',
    description: 'Chage application look & feel.',
    arguments: {
      theme: {
        title: 'Theme',
        description: 'Theme to set to.',
        type: 'String'
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

  callback(null, newReactions);
};
