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
          type: 'link',
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

  newTypes['link'] = {
    title: 'Navigation',
    description: 'Navigation structures.',
    standalone: false,
    fields: {
      title: {
        title: 'Title',
        type: 'text'
      },
      url: {
        title: 'URL',
        type: 'text'
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
