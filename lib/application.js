/*
 * Main application controller.
 */

/*
 * Module dependencies.
 */
var util = require('util');
var fs = require('fs');
var path = require('path');
var Prana = require('prana');
var express = require('express');
var flash = require('connect-flash');
var async = require('async');
var utils = Prana.utils;

/**
 * Main application controller class.
 *
 * @param {Server} mainApplication Main Connect server.
 * @param {String} hostname Application hostname.
 * @param {Object} settings Application settings object.
 * @class Application
 */
var Application = module.exports = function(mainApplication, hostname, settings) {
  Prana.call(this, settings);

  this.mainApplication = mainApplication;

  // Set hostname for easy access to it when needed.
  this.settings.hostname = hostname;

  // Create child application.
  this.application = express();

  // Initialize required middlewares.
  this.application.use(express.bodyParser());
  this.application.use(express.methodOverride());
  this.application.use(express.cookieParser());

  // TODO: figure out a way to make session optional.
  this.application.use(express.session({
    secret: this.settings.sessionSecret
  }));

  // Enable flash messages.
  this.application.use(flash());

  // Initialize routes variable.
  this.routes = {};

  // Initialize context related variables.
  this.conditions = {};
  this.reactions = {};
  this.contexts = {};
};

util.inherits(Application, Prana);

/**
 * Initialize application.
 *
 * @param {Function} callback Function to run when application finishes
 *   initializing.
 */
Application.prototype.start = function(callback) {
  // Setup application public files first to make sure applications can override
  // default application and extensions public files.
  this.application.use(express.static(this.settings.applicationDir + '/public'));
  this.application.use(express.static(this.settings.baseDir + '/applications/default/public'));

  var self = this;

  // Load all extensions and call init hooks on all of them.
  this.loadAllExtensions(function(error) {
    if (error) {
      return callback(error);
    }

    // Call Prana init that also calls init hook on all extensions.
    self.init(function() {
      // Create application vhost.
      self.mainApplication.use(express.vhost(self.settings.hostname, self.application));
      callback();
    });
  });
};

/**
 * Load all enabled extensions.
 *
 * @param {Function} callback Function to run when application finishes
 *   loading extensions.
 */
Application.prototype.loadAllExtensions = function(callback) {
  var extensionsPaths = [
    this.settings.baseDir + '/applications/default/extensions',
    this.settings.applicationDir + '/extensions'
  ];

  var self = this;
  this.loadExtensions(extensionsPaths, function(error, extensions) {
    if (error) {
      return callback(error);
    }
    async.each(Object.keys(extensions), function(extensionName, next) {
      // Add extension static files.
      var filesPath = extensions[extensionName].settings.path + '/public';
      fs.exists(filesPath, function(exists) {
        if (exists) {
          self.application.use(express.static(filesPath));
        }
        next();
      });
    }, callback);
  });
};
