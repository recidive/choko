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
    description: 'Themes change application look & feel.'
  };

  callback(null, newTypes);
};

/**
 * The reaction() hook.
 */
theme.reaction = function(reactions, callback) {
  var newReactions = {};

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
      response.payload.theme = value;
      callback();
    }
  };

  callback(null, newReactions);
};
