/*
 * Main Storage controller. Encapsulates all ORM/Waterline stuff.
 */

/*
 * Module dependencies.
 */
var Waterline = require('waterline');
var pranaAdapter = require('waterline-prana');
var mongoAdapter = require('sails-mongo');
var utils = require('prana').utils;
var modelPatch = require('./model-patch');
var adapterMethods = require('./adapter-patch');

/**
 * Main Storage controller class.
 *
 * @class Storage
 */
var Storage = module.exports = function(application) {
  this.application = application;

  // Create Waterline instance.
  this.waterline = new Waterline();
};

/**
 * Initialize the Storage at a given port.
 *
 * @param {Number} port Port number.
 * @param {Function} [callback] Optional callback to run when the Storage is initialized.
 */
Storage.prototype.init = function(callback) {
  // Add methods not implemented in waterline-prana that we need for
  // overrides to be persisted.
  utils.extend(pranaAdapter, adapterMethods(this.application));

  // Pass Choko instance to the Prana Waterline adapter.
  pranaAdapter.setApplication(this.application);

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
        url: this.application.settings.database
      }
    }
  };

  // Initialize Waterline ORM.
  var application = this.application;
  this.waterline.initialize(config, function(error, models) {
    if (error) {
      return callback(error);
    }

    // Waterline lowercase all collection names so we need to fix mappings
    // to make them consistent.
    var collections = {};
    for (var collectionName in models.collections) {
      var collection = models.collections[collectionName];
      var schema = collection.waterline.schema[collectionName];

      // Add type and application object to collections.
      collection.application = application;
      collection.type = application.types[schema.tableName];

      collections[schema.tableName] = collection;
    }

    callback(null, collections);
  });
};

Storage.prototype.type = function(name, settings) {
  // Create schema and register it in Waterline.
  var schema = {
    identity: name,
    tableName: name,
    schema: false,

    // @todo: allow extensions to add storages/connections/adapters.
    connection: (settings.storage == 'database' ? 'mongo' : 'prana'),

    // Disable automatic migration.
    migrate: 'safe',

    // Disable auto primary key and created/update.
    autoPK: (!settings.keyProperty),
    autoCreatedAt: false,
    autoUpdatedAt: false,

    // Initialize attibutes.
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
            var attribute = schema.attributes[fieldName] = {
              // Many-to-many relationships will just use array for now, since
              // waterline does not support many to many relatioships with
              // embbeded documents.
              // @todo: eventually we may be able to use something like this.
              // collection: fieldSettings.reference.type
              type: 'array'
            };
            if ('required' in fieldSettings) {
              attribute.required = fieldSettings.required;
            }
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
        // Process scalar fields.
        var field = this.application.fields[fieldSettings.type];
        var primaryKey = (settings.keyProperty == fieldName);
        var attribute = schema.attributes[fieldName] = {
          // Default type to string.
          type: 'string'
        };

        if (field.schema) {
          switch (typeof field.schema) {

            // If schema is a string it's the attribute type.
            case 'string':
              utils.extend(attribute, {
                type: field.schema
              });
              break;

            // If schema is a object it's the attribute settings object.
            case 'object':
              utils.extend(attribute, field.schema);
              break;

            // If schema is a function run it to get the attribute settings
            // object.
            case 'function':
              utils.extend(attribute, field.schema(fieldSettings));
              break;
          }
        }

        // Add required/unique properties if set.
        ['required', 'unique'].map(function(what) {
          if (what in fieldSettings) {
            attribute[what] = fieldSettings[what];
          }
        });

        if (primaryKey) {
          attribute.primaryKey = true;
        }
      }
    }
  }

  // Add validation related methods.
  // @todo: rename this something else than patch, since it's not this anymore.
  utils.extend(schema, modelPatch);

  // Add before/after callbacks.
  ['Validate', 'Update', 'Create', 'Destroy'].map(function(operation) {
    ['before', 'after'].map(function(when) {
      var callbackName = when + operation;
      if (callbackName in settings) {
        schema[callbackName] = settings[callbackName];
      }
    });
  });

  // Add type specific collection methods.
  if (settings.statics && schema.attributes) {
    utils.extend(schema, settings.statics);
  }

  // Add type methods to model.
  if (settings.methods && schema.attributes) {
    utils.extend(schema.attributes, settings.methods);
  }

  var collection = Waterline.Collection.extend(schema);

  // Load the collection into Waterline.
  this.waterline.loadCollection(collection);

  return collection;
};
