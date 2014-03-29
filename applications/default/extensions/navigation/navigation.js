var utils = require('prana').utils;
var async = require('async');

var navigation = module.exports;

/**
 * The permission() hook.
 */
navigation.permission = function(permissions, callback) {
  var newPermissions = {};

  newPermissions['manage-navigations'] = {
    title: 'Manage navigations',
    description: 'List, create and edit navigations.'
  };

  callback(null, newPermissions);
};

/**
 * The type() hook.
 */
navigation.type = function(types, callback) {
  var newTypes = {};

  newTypes['navigation'] = {
    title: 'Navigation',
    description: 'Navigation structures.',
    fields: {
      name: {
        title: 'Name',
        type: 'text',
        required: 'true'
      },
      title: {
        title: 'Title',
        type: 'text',
        required: 'true'
      },
      items: {
        title: 'Items',
        type: 'reference',
        reference: {
          type: 'navigationItem',
          multiple: true,
          inline: true
        }
      }
    },
    access: {
      'list': true,
      'load': true,
      'add': 'manage-navigations',
      'edit': 'manage-navigations',
      'delete': 'manage-navigations'
    }
  };

  newTypes['navigationItem'] = {
    title: 'Navigation item',
    description: 'Navigation item.',
    polymorphic: true,
    standalone: false,
    fields: {
      title: {
        title: 'Title',
        type: 'text',
        weight: -15
      }
    }
  };

  callback(null, newTypes);
};

/**
 * The navigationItemType() hook.
 */
navigation.navigationItemType = function(itemTypes, callback) {
  var newTypes = {};

  newTypes['link'] = {
    title: 'Link',
    description: 'Navigation link item.',
    standalone: false,
    fields: {
      url: {
        title: 'URL',
        type: 'text'
      }
    }
  };

  newTypes['action'] = {
    title: 'Action',
    description: 'Navigation action item.',
    standalone: false,
    fields: {
      action: {
        title: 'Action',
        type: 'text'
      }
    }
  };

  newTypes['divider'] = {
    title: 'Divider',
    description: 'Navigation divider item.',
    standalone: false
  };

  newTypes['dropdown'] = {
    title: 'Dropdown',
    description: 'Navigation dropdown item.',
    standalone: false,
    fields: {
      url: {
        title: 'URL',
        type: 'text'
      },
      items: {
        title: 'Items',
        type: 'reference',
        reference: {
          type: 'navigationItem',
          multiple: true,
          inline: true
        }
      }
    }
  };

  callback(null, newTypes);
};

/**
 * The panel() hook.
 */
navigation.panel = function(panels, callback) {
  var Navigation = this.application.type('navigation');
  Navigation.list({}, function(err, navigations) {
    if (err) {
      return callback(err);
    }
    // Create a panel for each navigation.
    var newPanels = {};
    async.each(Object.keys(navigations), function(navigationName, next) {
      var nav = navigations[navigationName];

      newPanels['navigation-' + navigationName] = {
        title: nav.title,
        description: 'The ' + nav.title + ' navigation.',
        type: 'item',
        bare: true,
        classes: nav.classes,
        itemType: 'navigation',
        itemKey: navigationName,
        template: nav.template || 'templates/navigation.html'
      };

      next();
    }, function() {
      callback(null, newPanels);
    });
  });
};
