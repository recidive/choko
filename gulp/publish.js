var gulp = require('gulp');
var git = require('gulp-git');
var spawn = require('child_process').spawn;

// Publish a new release to npm.
gulp.task('publish', ['build'], function(done) {
  git.status({
    // Use short format.
    args: '-s'
  },
  function (err, stdout) {
    if (err) {
      throw err;
    }
    if (!stdout) {
      // We have a clean working directory, proceed.
      spawn('npm', ['publish'], {
        stdio: 'inherit'
      }).on('close', done);
    }
    else {
      // Working directory not clean, abort.
      console.log('Working directory not clean, aborting...');
      done();
    }
  });
});
