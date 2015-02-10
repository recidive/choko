var Server = require('../lib/server');
var express = require('express');
var async = require('async');
var path = require('path');
var server;

before(function(done) {
  server = new Server(path.normalize(__dirname + '/applications'));
  this.getServer = function() {
    return server;
  };

  server.start(3200, function () {
    done();
  });
});

beforeEach(function(done) {
  var app = this.getServer().getApplication('localhost');

  var droppers = Object.keys(app.collections).map(function (collection) {
    return function (next) {
      app.collections[collection].drop(next);
    };
  });

  async.parallel(droppers, function () {
    done();
  });
});

after(function(done) {
  server.stop(done);
});
