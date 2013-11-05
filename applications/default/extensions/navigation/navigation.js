var navigation = module.exports;
var async = require('async');

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
      // Start panel as the navigation object itself.
      var panel = navigations[navigationName];
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
      newPanels['navigation-' + navigationName] = panel;
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
