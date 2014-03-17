/*
 * Main server controller.
 */

/*
 * Module dependencies.
 */
var util = require('util');
var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var express = require('express');
var async = require('async');
var Application = require('./application');
var utils = require('prana').utils;

/**
 * Main server controller class.
 *
 * @class Server
 */
var Server = module.exports = function(applicationsDir) {
  EventEmitter.call(this);

  this.baseDir = path.resolve(__dirname + '/..');

  this.applicationsDir = path.resolve(applicationsDir);

  // Create main express application.
  this.mainApplication = express();

  this.webServer = null;

  // Initialize applications container.
  this.applications = {};
};

util.inherits(Server, EventEmitter);

/**
 * Initialize the server at a given port.
 *
 * @param {Number} port Port number.
 * @param {Function} [callback] Optional callback to run when the server is initialized.
 */
Server.prototype.start = function(port, callback) {
  this.port = port;

  var self = this;

  // Load all applications.
  this.loadApplications(function() {

    // Start main application.
    self.webServer = self.mainApplication.listen(port, function() {
      self.emit('serverStarted', self, port);

      util.log('Choko server started on port ' + this.address().port + '.');

      if (callback) {
        callback(self);
      }
    });
  });
};

/**
 * Restart the server.
 *
 * @param {Function} callback Function to run when the server is restarted.
 */
Server.prototype.restart = function(callback) {
  var oldApplications = this.applications;
  var oldWebServer = this.webServer;

  // Create a new main application;
  this.mainApplication = express();

  // Let open connections end.
  oldWebServer.close();

  // Try to start the new server on the same port.
  this.start(this.port, function(server) {
    async.each(Object.keys(oldApplications), function(hostname, next) {
      // Unset routes for old apps, to minimise side effects until other
      // all old open connections closes.
      oldApplications[hostname].application.routes = {};
      next();
    }, function() {
      callback(server);
    });
  });
};

/**
 * Get and specific application by hostname.
 *
 * @param {String} hostname Application hostname.
 */
Server.prototype.getApplication = function(hostname) {
  return this.applications[hostname];
};

/**
 * Add an application.
 *
 * @param {String} hostname Application hostname.
 * @param {String} dir Application base directory.
 * @param {Function} callback Function to run when the application is started.
 */
Server.prototype.addApplication = function(hostname, dir, callback) {
  var settings = {};

  // Add default applicaton settings.
  var defaultSettings = JSON.parse(fs.readFileSync(path.join(this.baseDir, '/applications/default/settings.json'), 'utf-8'));

  utils.extend(settings, defaultSettings);

  // Add application settings.
  var applicationDir = path.join(this.applicationsDir, dir);
  var applicationSettings = JSON.parse(fs.readFileSync(path.join(applicationDir, '/settings.json'), 'utf-8'));

  utils.extend(settings, applicationSettings);

  // Add extensions from default app.
  settings.extensions = {};
  utils.extend(settings.extensions, defaultSettings.extensions);

  // Add in application extensions if any.
  if (applicationSettings.extensions) {
    utils.extend(settings.extensions, applicationSettings.extensions);
  }

  settings.baseDir = this.baseDir;
  settings.applicationDir = applicationDir;

  var application = this.applications[hostname] = new Application(this.mainApplication, hostname, settings);

  // Add a reference to the server to be used by the installer.
  // @todo: this may be not safe in shared server with multiple apps environment.
  application.server = this;

  var self = this;
  application.start(function() {
    self.emit('applicationAdded', hostname, application);

    util.log('Application "' + settings.application.name + '" started at "' + hostname + '".');
    callback();
  });
};

/**
 * Remove an application.
 *
 * @param {String} hostname Application hostname.
 */
Server.prototype.removeApplication = function(hostname) {
  var application = this.applications[hostname];
  delete this.applications[hostname];

  this.emit('applicationRemoved', hostname, application);

  // Removing middlewares can be possible in the future.
  // @see https://github.com/senchalabs/connect/pull/696
  //this.mainApplication.unuse(express.vhost(applicationName, application));
};

/**
 * Load all applications in the applications folders that are enabled on the
 * applications.js file.
 */
Server.prototype.loadApplications = function(callback) {
  var self = this;
  var applications = JSON.parse(fs.readFileSync(path.join(this.applicationsDir, '/applications.json'), 'utf-8'));
  async.each(Object.keys(applications), function(hostname, next) {
    self.addApplication(hostname, applications[hostname], next);
  }, callback);
};
