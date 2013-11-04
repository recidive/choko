var RouteController = require('./lib/route-controller');

var route = module.exports;

/**
 * The init() hook.
 */
route.init = function(application, callback) {
  var self = this;

  // Load all pages and routes.
  var Page = this.application.type('page');
  var Route = this.application.type('route');
  Page.list({}, function(err, pages) {
    if (err) {
      return callback(err);
    }

    Route.list({}, function(err, routes) {
      if (err) {
        return callback(err);
      }
      // Initialize the router middleware.
      self.application.application.use(self.application.application.router);

      callback();
    });
  });
};

/**
 * The type() hook.
 */
route.type = function(types, callback) {
  var self = this;
  var newTypes = {};

  newTypes['route'] = {
    title: 'Route',
    description: 'A route tells how to respond to requests.',
    process: function(path, settings) {
      // Routes can be objects, strings or functions.
      if (typeof settings === 'object') {
        settings.path = path;
      }
      else if (typeof settings === 'function') {
        settings = {
          path: path,
          callback: routeInfo,
          access: true
        };
      }
      else {
        settings = {
          path: path,
          content: routeInfo,
          access: true
        };
      }

      return new RouteController(self.application, settings);
    }
  };

  callback(null, newTypes);
};
