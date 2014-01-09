/*
 * Choko session storage.
 */

/*
 * Module dependencies.
 */
var util = require('util');
var Store = require('express').session.Store;
var async = require('async');

/**
 * ChokoStore constructor.
 *
 * @param {Application} application Choko application instance.
 */
var ChokoStore = module.exports = function(application) {
  this.model = application.type('session');
};

/**
 * Inherit from Store.
 */
util.inherits(ChokoStore, Store);

/**
 * Attempt to fetch session by the given hash.
 *
 * @param {String} hash
 * @param {Function} callback
 */
ChokoStore.prototype.get = function(hash, callback) {
  this.model.load(hash, function (error, session) {
    if (error) {
      return callback(error);
    }
    if (session) {
      callback(null, JSON.parse(session.data));
    }
    else {
      callback();
    }
  });
};

/**
 * Commit the given data object associated with the given hash.
 *
 * @param {String} hash
 * @param {Session} data
 * @param {Function} callback
 */
ChokoStore.prototype.set = function(hash, data, callback) {
  var session = {
    hash: hash,
    time: Date.now(),
    data: JSON.stringify(data)
  };

  if (data.user) {
    session.user = data.user._id;
  }

  this.model.save(session, function(error, affectedRows) {
    if (error && callback) {
      return callback(error);
    }
    callback && callback();
  });
};

/**
 * Destroy the session associated with the given hash.
 *
 * @param {String} hash
 * @param {Function} callback
 */
ChokoStore.prototype.destroy = function(hash, callback) {
  this.model.delete(hash, function(error) {
    if (error && callback) {
      return callback(error);
    }
    callback && callback();
  });
};

/**
 * Invoke the given callback with all active sessions.
 *
 * @param {Function} callback
 */
ChokoStore.prototype.all = function(callback) {
  this.model.query({}, function(error, sessions) {
    if (error) {
      return callback(error);
    }

    var result = [];

    if (!sessions) {
      return callback(null, result);
    }

    async.each(Object.keys(sessions), function(sessionKey, next) {
      result.push(JSON.parse(sessions[sessionKey].data));
      next();
    }, function() {
      callback(null, result);
    });
  });
};

/**
 * Clear all sessions.
 *
 * @param {Function} callback
 */
ChokoStore.prototype.clear = function(callback) {
  this.model.query({}, function(error, sessions) {
    if (error) {
      return callback(error);
    }

    if (!sessions) {
      return callback();
    }

    async.each(Object.keys(sessions), function(sessionKey, next) {
      sessions[sessionKey].delete(next);
    }, function() {
      callback();
    });
  });
};

/**
 * Fetch number of sessions.
 *
 * @param {Function} callback
 */
ChokoStore.prototype.length = function(callback) {
  this.model.query({}, function(error, sessions) {
    if (error) {
      return callback(error);
    }

    if (!sessions) {
      return callback(null, 0);
    }

    callback(null, Object.keys(sessions).length);
  });
};
