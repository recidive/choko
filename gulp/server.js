/**
 * Server related tasks.
 */

var fs    = require('fs'),
  gulp  = require('gulp'), async = require('async'),
  choko = require('../lib/application'),
  server;

/**
 * Initiate El-Tracker with a custom testing database.
 */
gulp.task('server:test', function (done) {

  // Create a server.
  module.exports.server = server = new choko('./test/applications/test-app');

  // Start the server.
  server.start(3000, function (error, server) {
    var droppers = Object.keys(server.collections).map(function (collection) {
          return function (next) {
            server.collections[collection].drop(next);
          };
        });

    // @todo: handle erros on droppers.
    async.parallel(droppers, function (err) {
      done();
    });
  });
});
