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
var async = require('async');
var utils = Prana.utils;
var modelPatch = require('./model-patch');
var MongoClient = require('mongodb').MongoClient;
var MongoDBStorage = require('prana-mongodb');

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

  async.series([
    // Connect to the database and add the database storage.
    function(next) {
      if (!self.settings.database) {
        return next();
      }

      MongoClient.connect(self.settings.database, function(error, database) {
        if (error) {
          return next(error);
        }

        // Add the 'mongodb' storage.
        self.storage('database', {
          controller: MongoDBStorage,
          database: database
        });

        next();
      });
    },

    // Load all extensions and call init hooks on all of them.
    function(next) {
      self.loadAllExtensions(next);
    },

    // Call Prana init that also calls init hook on all extensions.
    function(next) {
      // Overrided 'type' type process() callback.
      var originalProcess = self.types['type'].type.settings.process;
      self.types['type'].type.settings.process = function(name, settings) {
        var model = originalProcess(name, settings);
        // Add validation to all models.
        utils.extend(model, modelPatch);

        // Add validateAndSave() method to the model prototype.
        model.prototype.validateAndSave = function(callback) {
          model.validateAndSave(this, callback);
        };

        return model;
      };

      // Can't pass next directly to init() since it returns the application as
      // the first argument and next() expect an error or null.
      self.init(function() {
        next();
      });
    }

  ], function(error, results) {
    if (error) {
      return callback(error);
    }

    // Create application vhost.
    self.mainApplication.use(express.vhost(self.settings.hostname, self.application));
    callback();
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
