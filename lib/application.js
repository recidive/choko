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
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var serveStatic = require('serve-static');
var vhost = require('vhost');
var async = require('async');
var utils = Prana.utils;
var modelPatch = require('./model-patch');
var MongoClient = require('mongodb').MongoClient;
var MongoDBStorage = require('prana-mongodb');

// Patch Prana.
require('./prana-patch');

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
  this.application.use(bodyParser.urlencoded({
    extended: false
  }));
  this.application.use(bodyParser.json());
  this.application.use(methodOverride());
  this.application.use(cookieParser());

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
  this.application.use(serveStatic(this.settings.applicationDir + '/public'));
  this.application.use(serveStatic(this.settings.baseDir + '/applications/default/public'));

  var self = this;

  async.series([
    // Connect to the database and add the database storage.
    function(next) {
      if (!self.settings.database) {
        // Run installer if there are no database settings.
        return self.install(next);
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

        // Create types that will be used for collecting subtypes for
        // polymorphic types.
        if (settings.polymorphic) {
          self.type(name + 'Type', {
            title: settings.title + ' type',
            description: 'Type used to collect ' + settings.title.toLowerCase() + ' subtypes.',
            standalone: false
          });

          // Define a hidden property on model for type subtypes.
          Prana.Model.defineHiddenProperty(model, 'subtypes', {});
        }

        return model;
      };

      next();
    },

    // Call Prana init that also calls init hook on all extensions.
    function(next) {
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
    self.mainApplication.use(vhost(self.settings.hostname, self.application));
    callback();
  });
};

/**
 * Override Prana's init() method. Create subtypes for polymorphic types just
 * after initializing core types.
 *
 * @param {Function} callback Callback to run after prana was initialized.
 */
Application.prototype.init = function(callback) {
  var self = this;

  async.mapSeries(['storage', 'type', 'extension'], function(typeName, next) {
    // Load all data for 'storage', 'type' and 'extension'.
    self.type(typeName).list({}, next);
  },
  function(error, results) {
    if (error) {
      return callback(error);
    }

    // Add types for all polymorphic types subtypes.
    async.each(Object.keys(self.types), function(typeName, next) {
      var type = self.type(typeName);

      if (!type.type.settings.polymorphic) {
        return next();
      }

      // Get list of items for subtypes collector type.
      self.list(typeName + 'Type', {}, function(error, subtypes) {
        if (error) {
          return next(error);
        }

        async.each(Object.keys(subtypes), function(subtypeName, next) {
          var subtypeSettings = subtypes[subtypeName];
          // Set main type to use on form submit.
          subtypeSettings.mainTypeName = typeName;
          // Set short name to be used for classifying subtypes.
          subtypeSettings.shortName = subtypeName;
          // Initialize fields container if subtype has no fields.
          subtypeSettings.fields = subtypeSettings.fields || {};
          // Merge in main type fields.
          utils.extend(subtypeSettings.fields, type.type.settings.fields || {});
          // Create and store the subtype on the main type.
          type.subtypes[subtypeName] = self.type(subtypeName + utils.capitalizeFirstLetter(typeName), subtypeSettings);
          next();
        }, next);
      });
    }, function() {
      // Run init hook on all extensions.
      self.invoke('init', self, function() {
        callback.apply(self, results);
      })
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
          self.application.use(serveStatic(filesPath));
        }
        next();
      });
    }, callback);
  });
};

/**
 * Collect data from JSON files on application overrides folder and merge them
 * to the data container object.
 *
 * @param {Type} type Type object to collect data for.
 * @param {Object} data Data container object.
 * @param {Function} callback Callback to run after all data have been
 *   collected.
 */
Application.prototype.overrides = function(type, data, callback) {
  // The extension type don't allow collecting.
  if (type.name == 'extension') {
    return callback();
  }

  var overridesDir = path.join(this.settings.applicationDir, 'overrides');

  fs.exists(overridesDir, function(exists) {
    if (!exists) {
      return callback();
    }

    // Scan for JSON files for this type.
    Prana.Extension.scanItems(overridesDir, type.name, function(error, foundItems) {
      if (error) {
        return callback(error);
      }

      if (foundItems) {
        // Process all items from JSON files.
        Prana.Type.processAll(type, foundItems, data);
      }

      callback();
    });

  });
};

Application.prototype.install = function(callback) {
  this.settings.extensions = {
    'field': {},
    'route': {},
    'context': {},
    'layout': {},
    'panel': {},
    'navigation': {},
    'page': {},
    'theme': {},
    'rest': {},
    'form': {},
    'installer': {}
  };

  this.access = function(request, permission, callback) {
    // Allow access to eveything.
    callback(null, true);
  };

  callback();
};
