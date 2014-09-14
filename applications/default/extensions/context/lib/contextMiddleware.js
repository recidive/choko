var async = require('async');

// Context Middleware.
module.exports = function(application) {
  var contexts = application.contexts;

  return function(request, response, callback) {
    // Initialize payload object.
    response.payload = {
      contexts: []
    };

    if (request.user) {
      response.payload.user = request.user;
    }

    // Get context keys for sorting and using in context execution loop.
    var contextKeys = Object.keys(contexts);

    // Sort contexts by weight.
    async.sortBy(contextKeys, function(contextKey, next) {
      next(null, contexts[contextKey].weight || 0);
    },
    function(err, sortedContextKeys) {
      // Execute contexts in correct order.
      async.eachSeries(sortedContextKeys, function(contextName, next) {
        var context = contexts[contextName];
        context.execute(request, response, function(match) {
          if (match) {
            response.payload.contexts.push(contextName);
          }
          next();
        });
      }, function() {
        callback();
      });
    });
  }
};
