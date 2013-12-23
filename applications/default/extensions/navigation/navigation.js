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
    access: {
      'list': true,
      'load': true,
      'add': 'manage-navigations',
      'edit': 'manage-navigations',
      'delete': 'manage-navigations'
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
      var classes = ['nav'].concat(nav.classes);

      if (nav.stacked) {
        classes.push('nav-stacked');
      }

      newPanels['navigation-' + navigationName] = {
        title: nav.title,
        description: 'The ' + nav.title + ' navigation.',
        type: 'item',
        bare: true,
        classes: classes,
        itemType: 'navigation',
        itemKey: navigationName,
        template: 'templates/navigation.html'
      };

      next();
    }, function() {
      callback(null, newPanels);
    });
  });
};

/**
 * The navigation() hook.
 */
navigation.navigation = function(navigations, callback) {
  var newNavigations = {};

  newNavigations['main'] = {
    title: 'Main',
    description: 'Default main navigation.',
    classes: ['navbar-nav'],
    items: []
  };

  newNavigations['user'] = {
    title: 'User',
    description: 'User login and registration links.',
    classes: ['navbar-nav'],
    items: []
  };

  callback(null, newNavigations);
};
