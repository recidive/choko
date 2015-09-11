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
var async = require('async');
var lodash = require('lodash');
var utils = Prana.utils;
var Storage = require('./storage');
var cors = require('cors');
var chokoVersion = require('../package').version;

// Patch Prana.
require('./prana-patch');

/**
 * Main application controller class.
 *
 * @constructor
 * @param {Object|String} settings Application settings object or a application
 *   path string.
 */
var Application = module.exports = function(settings) {
  // If settings is a string its the application path, so we need to get the
  // settings by ourselves.
  if (typeof settings === 'string') {
    settings = this.buildSettings(settings);
  }

  Prana.call(this, settings);

  // Create express application.
  this.application = express();

  // Disable Express default X-Powered-By header and set a new one for Choko.
  this.application.disable('x-powered-by');
  this.application.use(function (request, response, next) {
    response.set('X-Powered-By', 'Choko');
    next();
  });

  this.webServer = null;

  // Express routers container. We use router to group middlewares and routes
  // so we selectivelly run a different stack to optimize processing.
  var routers = this.routers = {
    // Static router.
    static: express.Router(),
    rest: express.Router(),
    page: express.Router(),
  };

  // Initialize required middlewares.
  var middlewares = [
    bodyParser.urlencoded({
      extended: false
    }),
    bodyParser.json(),
    multer(),
    methodOverride(),
    // @todo: move cookieParser to session extension?
    cookieParser()
  ];

  // Settings cors middleware.
  if (this.settings.cors && this.settings.cors.enabled) {
    middlewares.push(cors(this.settings.cors));
  }

  // Add middlewares to rest and page routers.
  middlewares.forEach(function(middleware) {
    ['rest', 'page'].map(function(routerName) {
      routers[routerName].use(middleware);
    });
  });

  // Add all routers to the application.
  for (var routerName in routers) {
    this.application.use(routers[routerName]);
  }

  // Create storage instance.
  this.storage = new Storage(this);

  // Initialize fields, types and collections container.
  this.fields = {};
  this.types = {};
  this.collections = {};

  // Initialize routes container.
  this.routes = {};

  // Ordered list of public file directories.
  this.statics = [];

  // Storing choko version from package.json.
  this.version = chokoVersion;
};

util.inherits(Application, Prana);

/**
 * Initialize application.
 *
 * @param {Number} port Port to listen to.
 * @param {Function} callback Function to run when application finishes
 *   initializing.
 */
Application.prototype.start = function(port, callback) {
  // Setup application public files first to make sure applications can override
  // default application and extensions public files.
  this.static(this.settings.applicationDir + '/public');
  this.static(this.settings.baseDir + '/applications/default/public');

  var self = this;

  async.series([

    // Load all extensions and call init hooks on all of them.
    function(next) {
      self.loadAllExtensions(function() {
        // Add middleware to make html5mode work in angular.
        self.routers.page.use(function(request, response, next) {
          // If between JSON and HTML it prefers HTML, return index.html content since
          // we know its a direct browser request or another HTML consuming client.
          if (request.accepts(['json', 'html']) === 'html') {
            // Serve the right index.html taking into account overrides.
            return self.staticDiscover('index.html', function(indexFile) {
              response.status(200).sendFile(indexFile);
            });
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
          return next(error);
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
      if (callback) {
        return callback(error);
      }

      throw error;
    }

    // Start application.
    self.webServer = self.application.listen(port, function() {
      util.log('Choko application "' + self.settings.application.name + '" started on port ' + this.address().port + '.');

      if (callback) {
        callback(null, self);
      }
    });
  });
};

/**
 * Stop the server.
 *
 * @param {Function} callback Function to run when the server is stoped.
 */
Application.prototype.stop = function(callback) {
  this.webServer.close(callback);
};

/**
 * Build settings object from application path.
 *
 * @param {String} dir Application base directory.
 * @param {Function} callback Function to run when the application is started.
 */
Application.prototype.buildSettings = function(dir) {
  var modes = [];
  var mergingSettings = [];
  var applicationPaths = {
    default: path.resolve(__dirname, '../applications/default'),
    main: path.resolve(dir)
  };

  // Always add environment mode.
  modes.push(process.env.NODE_ENV);

  // Default settings.
  var settings = {
    baseDir: path.resolve(__dirname + '/..'),
    applicationDir: applicationPaths.main
  };

  // Loop through applications.
  Object.keys(applicationPaths).forEach(function(name) {

    // Initiate possible settings files paths array.
    var applicationSettings = [];

    // Add default main settings file for this application.
    applicationSettings.push(applicationPaths[name] + '/settings.json');
    applicationSettings.push(applicationPaths[name] + '/settings.local.json');

    // Loop through modes to register possible file paths.
    modes.forEach(function(mode) {
      var filePath = applicationPaths[name] + '/settings.' + mode;

      // Register possible file paths for both 'mode' and 'mode.local'.
      applicationSettings.push(filePath + '.json');
      applicationSettings.push(filePath + '.local.json');
    });

    // Loop through defined file paths to load the ones that exist.
    applicationSettings.forEach(function(filePath) {
      if (fs.existsSync(filePath)) {
        mergingSettings.push(require(path.relative(__dirname, filePath)));
      }
    });
  });

  // Load and merge all the settings.
  lodash.merge.apply(null, [settings].concat(mergingSettings));

  return settings;
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
          self.static(filesPath);
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
 * Add directory with files to serve.
 *
 * @param {String} path Path to directory to add to static router.
 */
Application.prototype.static = function(path) {
  var staticRouter = this.routers.static;
  staticRouter.use(express.static(path));
  this.statics.push(path);
};

/**
 * Discover the filesystem path for a file being served by static middleware
 * taking into account overrides.
 *
 * @param {String} filePath Path to file to find path to.
 * @return {String|Boolean} Path to the first file found or false.
 */
Application.prototype.staticDiscover = function(filePath, callback) {
  async.detectSeries(this.statics, function(dir, next) {
    fs.exists(path.join(dir, filePath), next);
  },
  function(dir) {
    return dir ? callback(path.join(dir, filePath)) : callback(false);
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
 * @param {Mixed} criteria The key that represents the object to load or an
 *    object with unique fields based query to search for it.
 * @param {Function} callback Function to run when the item is returned.
 */
Application.prototype.load = function(typeName, criteria, callback) {
  this.type(typeName).load(criteria, callback);
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
