var Application = require('../lib/application');
var express = require('express');
var async = require('async');
var path = require('path');
var app;

before(function(done) {
  app = new Application(path.normalize(__dirname + '/applications/test-app'));
  this.getApp = function() {
    return app;
  };

  app.start(3200, function () {
    done();
  });
});

beforeEach(function(done) {
  var app = this.getApp();

  var droppers = Object.keys(app.collections).map(function (collection) {
    return function (next) {
      app.collections[collection].drop(next);
    };
  });

  async.parallel(droppers, function () {
    done();
  });
});
