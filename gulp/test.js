/**
 * Test related tasks.
 */

var gulp = require('gulp'),
  spawn = require('child_process').spawn,
  app = require('./server');

/**
 * Print buffer string.
 */
function logBuffer(data) {
  console.log(data.toString());
}

/**
 * E2E test: uses Protractor to perform e2e tests.
 */
gulp.task('test:e2e', ['server:test'], function (done) {
  var protractor = spawn('protractor', ['test/e2e/protractor.conf.js']);

  protractor.stdout.on('data', logBuffer);
  protractor.stderr.on('data', logBuffer);

  protractor.on('exit', function (code) {

    // Stop server.
    app.server.stop(done);

    // @todo: fix Choko stop issue.
    process.exit();
  });
});
