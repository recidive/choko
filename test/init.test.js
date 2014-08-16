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
  var db = this.getServer().getApplication('localhost').storage('database').database;
  
  db.collections(function(err, collections) {
    var droppers = collections.map(function (collection) {
      return function (next) {
        db.dropCollection(collection.collectionName, next);
      };
    });
    
    async.parallel(droppers, function () {
      done();
    });
  });
});

after(function(done) {  
  server.stop(done);
});
