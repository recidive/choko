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

  newTypes['panel'] = {
    title: 'Panel',
    description: 'A piece of content to be displayed on a layout region.',
    polymorphic: true,
    fields: {
      name: {
        title: 'Name',
        type: 'text',
        required: 'true',
        weight: -15
      },
      title: {
        title: 'Title',
        type: 'text',
        required: 'true',
        weight: -5
      }
    },
    access: {
      'list': 'manage-panels',
      'load': 'manage-panels',
      'add': 'manage-panels',
      'edit': 'manage-panels',
      'delete': 'manage-panels'
    }
  };

  newTypes['panelReaction'] = {
    title: 'Panel reaction',
    formTitle: 'Region',
    description: 'Panel reaction item used on panel context reaction.',
    standalone: false,
    fields: {
      region: {
        title: 'Region',
        description: 'Region to add the panel.',
        type: 'text'
      },
      panels: {
        title: 'Panels',
        description: 'Panels to show.',
        type: 'reference',
        reference: {
          type: 'panelReactionPanel',
          multiple: true,
          inline: true,
          titleField: 'panel'
        }
      }
    }
  };

  newTypes['panelReactionPanel'] = {
    title: 'Panel reaction panel',
    formTitle: 'Panel',
    description: 'Panel reaction item panel used on panel context reaction.',
    standalone: false,
    fields: {
      panel: {
        title: 'Panel',
        type: 'reference',
        reference: {
          type: 'panel'
        }
      },
      weight: {
        title: 'Weight',
        type: 'text'
      }
    }
  };

  callback(null, newTypes);
};


/**
 * The panelType() hook.
 */
panel.panelType = function(panelTypes, callback) {
  var newTypes = {};

  newTypes['list'] = {
    title: 'List panel',
    description: 'A item list panel.',
    fields: {
      itemType: {
        title: 'Item type',
        type:  'text',
        required: true
      }
    }
  };

  newTypes['item'] = {
    title: 'Item panel',
    description: 'A single item panel.',
    fields: {
      itemType: {
        title: 'Item type',
        type:  'text',
        required: true
      },
      itemKey: {
        title: 'Item key',
        type:  'text',
        required: true
      }
    }
  };

  newTypes['form'] = {
    title: 'Form panel',
    description: 'A form panel.',
    fields: {
      formName: {
        title: 'Form',
        type:  'reference',
        reference: {
          type: 'form'
        },
        required: true
      },
      redirect: {
        title: 'Redirect',
        type: 'text',
        description: 'Enter a path to redirect user upon successful form submission.'
      }
    }
  };

  callback(null, newTypes);
}


/**
 * The panel() hook.
 */
panel.panel = function(panels, callback) {
  var newPanels = {}

  newPanels['brand'] = {
    title: 'Brand',
    description: 'Application name or logo.',
    bare: true,
    content: this.application.settings.application.name
  }

  callback(null, newPanels);
};

/**
 * The contextReactionType() hook.
 */
panel.contextReactionType = function(reactionTypes, callback) {
  var self = this;
  var newReactionTypes = {};

  newReactionTypes['panel'] = {
    title: 'Show panels',
    description: 'Show panels on one or more layout regions.',
    standalone: false,
    fields: {
      panels: {
        title: 'Panels',
        description: 'Panels to show.',
        type: 'reference',
        reference: {
          type: 'panelReaction',
          multiple: true,
          inline: true,
          titleField: 'region',
          index: 'region'
        }
      }
    },
    react: function(request, response, regionPanels, callback) {

      // Get panel type.
      var Panel = self.application.type('panel'); 

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

  callback(null, newReactionTypes);
};

/**
 * The responseAlter() hook.
 */
panel.responseAlter = function (data, callback) {

  var payload = data.payload || {};
  var layout = payload.data && payload.data.layout; 
  var panels = payload.data && payload.data.panels;

  if (layout && panels) {

    /**
     * Recursively verifies if a row/column is empty.
     */
    function findContent(region, childType) {

      // Consider empty by default.
      region.empty = true;

      if (region.region == true) {
        region.empty = !Boolean(panels[region.name] && panels[region.name].length);
      }
      // Iterate recursively
      else if (region[childType] && region[childType].length) {
        region[childType].forEach(function (childRegion) {
          var childEmpty = findContent(childRegion, childType == 'rows' ? 'columns' : 'rows');
          region.empty = !region.empty ? region.empty : childEmpty;
        });
      }

      return region.empty;
    }

    // As a layout contains rows, it behaves much like a column itself.
    findContent(layout, 'rows');
  }

  callback();
};
