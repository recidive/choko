var exampleRoute = module.exports;

/**
 * The route() hook.
 */
exampleRoute.route = function(routes, callback) {
  var newRoutes = {};

  newRoutes['/example-route'] = {
    access: true,
    callback: function(request, response, callback) {
      // Add a flash message.
      request.flash('info', 'Some info to display to the user.');

      // Call callback passing in some data.
      callback(null, {
        title: 'Example route'
      });
    }
  };

  callback(null, newRoutes);
};
