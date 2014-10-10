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
var multer = require('multer');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var vhost = require('vhost');
var async = require('async');
var lodash = require('lodash');
var utils = Prana.utils;
var Storage = require('./storage');

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
  this.application.use(multer());
  this.application.use(methodOverride());
  this.application.use(cookieParser());

  // Create storage instance.
  this.storage = new Storage(this);

  // Initialize fields, types and collections container.
  this.fields = {};
  this.types = {};
  this.collections = {};

  // Initialize routes container.
  this.routes = {};
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

    // Run installer if there are no database settings.
    function(next) {
      if (!self.settings.database) {
        return self.install(next);
      }
      next();
    },

    // Load all extensions and call init hooks on all of them.
    function(next) {
      self.loadAllExtensions(function() {
        // Add middleware to make html5mode work in angular.
        self.application.use(function(request, response, next) {
          // If between HTML and JSON it prefers HTML, return index.html content since
          // we know its a direct browser request or another HTML consuming client.
          if (request.accepts(['html', 'json']) === 'html') {
            // @todo: Make it figure out the correct path for index.html being
            // served statically.
            return response.status(200).sendFile(path.normalize(__dirname + '/../applications/default/public/index.html'));
          }
          next();
        });
        next();
      });
    },

    // Load all fields and types.
    function(next) {
      self.collect('field', function(error, fields) {
        if (error) {
          return callback(error);
        }

        self.fields = fields;
        self.loadAllTypes(next);
      });
    },

    // Initialize Storage.
    function(next) {
      self.storage.init(function(error, collections) {
        if (error) {
          return callback(error);
        }
        self.collections = collections;
        next();
      });
    },

    // Call Prana init that also calls init hook on all extensions.
    function(next) {
      // Can't pass next directly to init() since it returns the application as
      // the first argument and next() expect an error or null.
      self.init(function() {
        next();
      });
    }
  ],
  function(error, results) {
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

  // Add types for all polymorphic types subtypes.
  async.each(Object.keys(self.types), function(typeName, next) {
    var type = self.types[typeName];

    if (!type.polymorphic) {
      return next();
    }

    // Initialize subtypes container.
    type.subtypes = type.subtypes || {};

    // Get list of items for subtypes collector type.
    self.collect(typeName + 'Type', function(error, subtypes) {
      if (error) {
        return next(error);
      }

      async.each(Object.keys(subtypes), function(subtypeName, next) {
        var subtypeSettings = {
          name: subtypeName,
          // Set main type to use on form submits.
          mainTypeName: typeName,
          // Set short name to be used for classifying subtypes.
          shortName: subtypeName,
          // Initialize fields container.
          fields: {}
        };
        utils.extend(subtypeSettings, subtypes[subtypeName]);

        // Merge in main type fields.
        if (type.fields) {
          utils.extend(subtypeSettings.fields, type.fields);
        }

        // Create and store the subtype on the main type.
        type.subtypes[subtypeName] = subtypeSettings;
        self.type(subtypeName + utils.capitalizeFirstLetter(typeName), subtypeSettings);

        next();
      }, next);
    });
  },
  function() {
    // Run init hook on all extensions.
    self.invoke('init', self, callback);
  });
};

/**
 * Override Prana.collect() to add overrides.
 *
 * @param {String} type Type of data to collect items for.
 * @param {Function} callback Callback to run after all data have been
 *   collected.
 */
Application.prototype.collect = function(type, callback) {
  var self = this;
  Prana.prototype.collect.call(this, type, function(error, result) {
    if (error) {
      return callback(error);
    }

    self.overrides(type, result, function() {
      callback(null, result);
    });
  });
};

/**
 * Set or get a type.
 *
 * @param {String} name A string to be used to identify the type.
 * @param {Object} settings The settings for for the type to be created.
 * @return {Model} A Model subclass created exclusivelly for this type.
 */
Application.prototype.type = function(name, settings) {
  // If there's no settings we want to get a type.
  if (!settings) {
    // Return this as earlier as possible.
    return this.collections[name];
  }

  // Default type properties.
  var settings = lodash.merge({
    name: name,
    storage: 'memory'
  }, settings);

  // If keyProperty is not set and there's a 'name' field, set it to be the
  // keyProperty. Otherwise a primary key will be create and handled for this
  // type in waterline.
  if (!('keyProperty' in settings) && 'fields' in settings && 'name' in settings.fields) {
    settings.keyProperty = 'name';
  }

  // Add type to types container.
  this.types[name] = settings;

  // Register type on Storage.
  this.storage.type(name, settings);
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

/**
 * Load all types.
 *
 * @param {Function} callback Function to run when application finishes
 *   loading types.
 */
Application.prototype.loadAllTypes = function(callback) {
  var self = this;

  // Collect types from all extensions.
  this.collect('type', function(error, types) {
    if (error) {
      return callback(error);
    }

    async.each(Object.keys(types), function(typeName, next) {
      self.type(typeName, types[typeName]);
      next();
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
  var overridesDir = path.join(this.settings.applicationDir, 'overrides');

  fs.exists(overridesDir, function(exists) {
    if (!exists) {
      return callback();
    }

    // Scan for JSON files for this type.
    Prana.Extension.scanItems(overridesDir, type, function(error, foundItems) {
      if (error) {
        return callback(error);
      }

      utils.extend(data, foundItems);
      callback();
    });

  });
};

/**
 * List items from the storage.
 *
 * @param {String} typeName A type name string.
 * @param {Object} query Query object with conditions and filters.
 * @param {Function} callback Function to run when items are returned.
 */
Application.prototype.list = function(typeName, query, callback) {
  this.type(typeName).list(query, callback);
};

/**
 * Load a single item from the storage.
 *
 * @param {String} typeName A type name string.
 * @param {Mixed} key The key that represents the object to load.
 * @param {Function} callback Function to run when the item is returned.
 */
Application.prototype.load = function(typeName, key, callback) {
  this.type(typeName).load(key, callback);
};

/**
 * Save a item to the storage.
 *
 * @param {String} typeName A type name string.
 * @param {Object} key Object with values for the object.
 * @param {Function} callback Function to run when the item is saved.
 */
Application.prototype.save = function(typeName, item, callback) {
  this.type(typeName).save(item, callback);
};

/**
 * Delete a single item from the storage.
 *
 * @param {String} typeName A type name string.
 * @param {Mixed} key The key that represents the object to delete.
 * @param {Function} callback Function to run when the item is deleted.
 */
Application.prototype.delete = function(typeName, key, callback) {
  this.type(typeName).delete(key, callback);
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
