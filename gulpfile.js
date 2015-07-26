var gulp = require('gulp');
var bower = require('gulp-bower');

// Bower install.
gulp.task('bower', function() {
  return bower();
});

// Build Choko.
gulp.task('build', ['bower']);
