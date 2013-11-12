var layout = module.exports;

/**
 * The type() hook.
 */
layout.type = function(types, callback) {
  var newTypes = {};

  newTypes['layout'] = {
    title: 'Layout',
    description: 'Layout defines page structure.',
    key: 'name'
  };

  callback(null, newTypes);
};

/**
 * The reaction() hook.
 */
layout.reaction = function(reactions, callback) {
  var self = this;
  var newReactions = {};

  newReactions['layout'] = {
    title: 'Set layout',
    description: 'Set the layout.',
    arguments: {
      layout: {
        title: 'Layout',
        description: 'Layout to set to.',
        type: 'String'
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

  callback(null, newReactions);
};
