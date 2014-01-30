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

  // Initialize applications container.
  this.applications = {};
};

util.inherits(Server, EventEmitter);

/**
 * Initialize the server at a given port.
 *
 * @param {Number} port Port number.
 * @param {Function} [callback] Optional callback to run when the server is initialized..
 */
Server.prototype.start = function(port, callback) {
  var self = this;

  // Load all applications.
  this.loadApplications(function() {

    // Start main application.
    self.mainApplication.listen(port, function() {
      self.emit('serverStarted', self, port);

      util.log('Choko server started on port ' + this.address().port + '.');

      if (callback) {
        callback();
      }
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
  utils.extend(settings.extensions, applicationSettings.extensions);

  settings.baseDir = this.baseDir;
  settings.applicationDir = applicationDir;

  var self = this;
  var application = this.applications[hostname] = new Application(this.mainApplication, hostname, settings);

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
