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
var Waterline = require('waterline');
var pranaAdapter = require('waterline-prana');
var mongoAdapter = require('sails-mongo');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var serveStatic = require('serve-static');
var vhost = require('vhost');
var async = require('async');
var lodash = require('lodash');
var utils = Prana.utils;
var modelPatch = require('./model-patch');

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

  // Create Waterline instance.
  this.waterline = new Waterline();

  // Initialize types and collections container.
  this.types = {};
  this.collections = {};

  // Initialize routes container.
  this.routes = {};

  // Initialize context related variables.
  // @todo: implementa cache system for holding this kind of data as well as
  // others above, so we can rebuild it (invalidate cache) easily.
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

    // Run installer if there are no database settings.
    function(next) {
      if (!self.settings.database) {
        return self.install(next);
      }
      next();
    },

    // Load all extensions and call init hooks on all of them.
    function(next) {
      self.loadAllExtensions(next);
    },

    // Load all types and create collections for them in Waterline.
    function(next) {
      self.loadAllTypes(next);
    },

    // Configure and initialize Waterline.
    function(next) {
      // Pass Choko instance to the Prana Waterline adapter.
      pranaAdapter.setApplication(self);

      var config = {
        adapters: {
          'prana': pranaAdapter,
          'mongo': mongoAdapter
        },
        connections: {
          'prana': {
            adapter: 'prana'
          },
          'mongo': {
            adapter: 'mongo',
            url: self.settings.database
          }
        }
      };

      async.each(Object.keys(self.types), function(typeName, next) {
        self.type(typeName, self.types[typeName]);
        next();
      },
      function(result) {
        // Initialize Waterline ORM.
        self.waterline.initialize(config, function(error, models) {
          self.collections = models.collections;

          // Add type and application object to collections.
          for (var collectionName in self.collections) {
            self.collections[collectionName].application = self;
            self.collections[collectionName].type = self.types[collectionName];
          }

          next();
        });
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

  // @todo: improve indentation after commiting.

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
          var subtypeSettings = lodash.cloneDeep(subtypes[subtypeName]);

          // @todo: improve this, maybe use loadash.merge().

          // Set main type to use on form submit.
          subtypeSettings.mainTypeName = typeName;
          // Set short name to be used for classifying subtypes.
          subtypeSettings.shortName = subtypeName;
          // Initialize fields container if subtype has no fields.
          subtypeSettings.fields = subtypeSettings.fields || {};
          // Merge in main type fields.
          utils.extend(subtypeSettings.fields, type.fields || {});
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
    keyProperty: 'name',
    required: false
  }, settings);

  // Create schema and register it in Waterline.
  var schema = {
    identity: name,
    schema: false,
    connection: (settings.storage == 'database' ? 'mongo' : 'prana'),
    autoPK: (!settings.keyProperty),
    attributes: {}
  };

  if (settings.fields) {
    // Create attributes for all type fields.
    for (fieldName in settings.fields) {
      var fieldSettings = settings.fields[fieldName];

      // Process reference fields.
      if (fieldSettings.type == 'reference' && fieldSettings.reference) {
        if (fieldSettings.reference.inline) {
          // Use 'array' or 'json' for inline references.
          schema.attributes[fieldName] = {
            type: fieldSettings.reference.multiple ? 'array' : 'json',
            required: fieldSettings.required
          };
        }
        else {
          if (fieldSettings.reference.multiple) {
            schema.attributes[fieldName] = {
              // Many-to-many relationships will just use array for now, since
              // waterline does not support many to many relatioships with
              // embbeded documents.
              // @todo: eventually we may be able to use something like this.
              // collection: fieldSettings.reference.type
              type: 'array',
              required: fieldSettings.required,
            };
          }
          else {
            schema.attributes[fieldName] = {
              required: fieldSettings.required,
              model: fieldSettings.reference.type
            };
          }
        }
      }
      else {
        var primaryKey = (settings.keyProperty == fieldName);
        // Process scalar fields.
        var attribute = schema.attributes[fieldName] = {
          type: 'string',
          // @todo: we can't just set primaryKey here since if it's set to
          // false it will behave like if it was set to true.
          // See https://github.com/balderdashy/waterline/issues/606
          // primaryKey: primaryKey,

          // Primary keys need to be required and unique.
          required: fieldSettings.required || primaryKey,
          unique: fieldSettings.unique || primaryKey
        };

        // Set primary key verbose like this since it can't be set to false due
        // to a bug in waterline, see above.
        if (primaryKey) {
          attribute.primaryKey = true;
        }
      }
    }
  }

  // Add validation related methods.
  // @todo: rename this something else than patch, since it's not this anymore.
  utils.extend(schema, modelPatch);

  // Add type methods to model.
  if (settings.methods && schema.attributes) {
    utils.extend(schema.attributes, settings.methods);
  }


  var collection = Waterline.Collection.extend(schema);

  // Load the collection into Waterline.
  this.waterline.loadCollection(collection);
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
 * Load all types.
 *
 * @param {Function} callback Function to run when application finishes
 *   loading types.
 */
Application.prototype.loadAllTypes = function(callback) {
  var self = this;

  // Collect types from all extensions.
  this.collect('type', function(error, types) {
    self.types = types;
    callback();
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
