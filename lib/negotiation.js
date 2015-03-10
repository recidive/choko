// Content-type negotiation middleware.
module.exports = function(application) {
  return function(request, response, callback) {
    // If between JSON and HTML it prefers HTML, return index.html content since
    // we know its a direct browser request or another HTML consuming client.
    if (request.accepts(['json', 'html']) === 'html') {
      // Serve the right index.html taking into account overrides.
      return self.staticDiscover('index.html', function(indexFile) {
        response.status(200).sendFile(indexFile);
      });
    }
    callback();
  }
};
