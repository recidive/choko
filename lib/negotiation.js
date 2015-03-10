var async = require('async');

// Content-type negotiation middleware.
module.exports = function(application) {
  return function(request, response, callback) {
    async.waterfall([
      function(next) {
        application.invoke('negotiation', request, response, next);
      },
      function(propagate, next) {
        if (propagate === false) {
          return next();
        }

        // If between JSON and HTML it prefers HTML, return index.html content since
        // we know its a direct browser request or another HTML consuming client.
        if (request.accepts(['json', 'html']) === 'html') {
          // Serve the right index.html taking into account overrides.
          return application.staticDiscover('index.html', function(indexFile) {
            response.status(200).sendFile(indexFile);
          });
        }

        next();
      }
    ], callback);
  };
};
