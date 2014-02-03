var async = require('async');

var panel = module.exports;

/**
 * The permission() hook.
 */
panel.permission = function(permissions, callback) {
  var newPermissions = {};

  newPermissions['manage-panels'] = {
    title: 'Manage panels',
    description: 'List, create and edit panels.'
  };

  callback(null, newPermissions);
};

/**
 * The type() hook.
 */
panel.type = function(types, callback) {
  var newTypes = {};
  var self = this;

  newTypes['panel'] = {
    title: 'Panel',
    description: 'A piece of content to be displayed on a layout region.',
    access: {
      'list': 'manage-panels',
      'load': 'manage-panels',
      'add': 'manage-panels',
      'edit': 'manage-panels',
      'delete': 'manage-panels'
    }
  };

  callback(null, newTypes);
};

/**
 * The reaction() hook.
 */
panel.reaction = function(reactions, callback) {
  var self = this;
  var newReactions = {};

  newReactions['panel'] = {
    title: 'Show a panel',
    description: 'Show a panel on some layout region.',
    arguments: {
      panels: {
        title: 'Panels',
        description: 'Panels to show.',
        type: 'Object'
      }
    },
    react: function(request, response, regionPanels, callback) {
      // Initialize panels container if not initialized yet.
      response.payload.panels = response.payload.panels || {};

      // Add all panels to response payload.
      async.each(Object.keys(regionPanels), function(regionName, next) {
        // Initialize panels container if not initialized yet.
        response.payload.panels[regionName] = response.payload.panels[regionName] || [];
        var panels = regionPanels[regionName];
        // A context can set several panels for a region.
        async.each(panels, function(regionPanel, next) {
          // Load the panel.
          var Panel = self.application.type('panel');

          Panel.load(regionPanel.name, function(err, panel) {
            if (err) {
              return callback(err);
            }

            if (panel) {
              // Set panel weight and add it to the region.
              panel.weight = regionPanel.weight;
              response.payload.panels[regionName].push(panel);
            }
            next();
          });

        }, function() {
          next();
        });
      }, function(err) {
        if (err) {
          return callback(err);
        }
        callback();
      });
    }
  };

  callback(null, newReactions);
};
