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
      },
      description: {
        title: 'Title',
        type: 'text'
      },
      thumbnail: {
        title: 'Thumbnail',
        type: 'text'
      }
    },
    access: {
      'list': 'manage-themes',
      'load': 'manage-themes',
      'add': 'manage-themes',
      'edit': 'manage-themes',
      'delete': 'manage-themes'
    },
    displays: {
      'thumbnail': {
        'image': [{
          fieldName: 'thumbnail',
          format: 'image',
          weight: 0
        }],
        'caption': [{
          fieldName: 'title',
          format: 'title',
          weight: 0
        },
        {
          fieldName: 'description',
          format: 'paragraph',
          weight: 5
        }]
      }
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
    description: 'Change application look & feel.',
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
