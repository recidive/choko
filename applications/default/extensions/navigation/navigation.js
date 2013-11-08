var utils = require('prana').utils;
var async = require('async');

var navigation = module.exports;

/**
 * The type() hook.
 */
navigation.type = function(types, callback) {
  var newTypes = {};

  newTypes['navigation'] = {
    title: 'Navigation',
    description: 'Navigation menus and breadcrumbs.'
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
    var newPanels = {};
    async.each(Object.keys(navigations), function(navigationName, next) {
      // Start from an empty object.
      var panel = {}

      // Add properties from the navigation object itself.
      utils.extend(panel, navigations[navigationName]);

      // Add 'navigation-' prefix to panel name.
      panel.name = 'navigation-' + navigationName;

      if (!panel.template) {
        if (panel.style == 'navbar') {
          // Navbar style has a different template.
          panel.template = 'templates/navbar.html';
          // Navbar style panels are better as bare.
          panel.bare = true;
        }
        else {
          panel.template = 'templates/navigation.html';
        }
      }

      newPanels[panel.name] = panel;
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
    title: this.application.settings.application.name,
    description: 'Main navigation.',
    style: 'navbar',
    items: []
  };

  callback(null, newNavigations);
};
