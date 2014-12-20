/*
 * Patch for Model class to add validation and sanitizing methods.
 */

var async = require('async');
var utils = require('prana').utils;

var modelPatch = module.exports = {

  // Add legacy methods.
  save: function(data, callback) {
    if (!(this.primaryKey in data)) {
      // Add item.
      return this.create(data, callback);
    }

    var itemKey = data[this.primaryKey];
    var self = this;
    this.load(itemKey, function(error, item) {
      if (error) {
        return callback(error);
      }

      if (item) {
        // Update item.
        utils.extend(item, data);
        item.save(callback);
      }
      else {
        // Add item.
        self.create(data, callback);
      }
    });
  },

  list: function(criteria, callback) {
    var self = this;

    this.find(criteria, function(error, items) {
      if (error) {
        return callback(error);
      }

      // @todo: we convert from array to object since the front end is expecting
      // data this way. In the long run we may change this, so we can return
      // array to have better performance.
      var result = {};
      var primaryKey = this.primaryKey;
      items.map(function(item) {
        var itemKey = item[primaryKey];
        result[itemKey] = item;
      });

      // Invoke operation hook on all extensions.
      self.application.invoke('list', self.type, result, function(error, data) {
        if (error) {
          return callback(error);
        }
        callback(null, result);
      });
    });

  },

  load: function(key, callback) {
    var primaryKey = this.primaryKey;
    var query = {};
    query[primaryKey] = key;
    this.list(query, function(error, items) {
      if (error) {
        return callback(error);
      }
      callback(null, items[key]);
    });
  },

  delete: function() {
    this.destroy.apply(this, arguments);
  },

  validateAndSave: function(item, callback) {
    var self = this;
    this._validate(item, function(error, errors) {
      if (error) {
        // Application error.
        return callback(error);
      }
      if (errors.length > 0) {
        // Validation errors.
        callback(null, item, errors);
      }
      else {
        // Allow calling REST POST for validating non standalone types.
        if (self.type.standalone === false) {
          return callback(null, item);
        }

        self.save(self.filter(item), callback);
      }
    });
  },

  _validate: function(item, callback) {
    var errors = [];
    var self = this;

    if (this.type.polymorphic) {
      if (!item.type) {
        errors.push('Error: type is required.');
        return callback(null, errors);
      }
      else if (!(item.type in this.type.subtypes)) {
        errors.push('Error: unrecognized type: ' + item.type + '.');
        return callback(null, errors);
      }
      // Get field for polymorphic type subtypes.
      var fields = this.type.subtypes[item.type].fields || {};
    }
    else {
      var fields = this.type.fields || {};
    }

    // Validate type fields.
    async.each(Object.keys(fields), function(fieldName, next) {
      var fieldSettings = fields[fieldName];
      // Add field name to field settings to be used by the field validation
      // vallback to extract the field value from the item.
      // @todo in the long run we may want to add a typeField type to link the
      // type to its fields properly, so once type is loaded properly it will
      // have the name property set.
      fieldSettings.name = fieldName;

      // If field is required check if a value was supplied for it.
      if (fieldSettings.required && !(fieldName in item)) {
        errors.push(fieldSettings.title + ' is required.');
      }

      if (!(fieldName in item)) {
        // The field doesn't have a value, so nothing to validate.
        return next();
      }

      var concatFieldErrors = function(error, fieldErrors) {
        if (error) {
          return next(error);
        }

        if (fieldErrors) {
          errors = errors.concat(fieldErrors);
        }
        next();
      };

      // If field is unique check if a item with same value set is not present.
      if (fieldSettings.unique && fieldName in item) {
        var query = {};
        query[fieldName] = item[fieldName];
        return self.application.load(self.type.name, query, function (error, existing) {
          if (error) {
            return next(error);
          }

          if (existing) {
            errors.push(fieldSettings.title + ' must be unique.');
          }
          self.validateField(fieldSettings, item, concatFieldErrors);
        });
      }

      self.validateField(fieldSettings, item, concatFieldErrors);
    },
    function(error) {
      if (error) {
        // Application error.
        return callback(error);
      }
      callback(null, errors);
    });
  },

  /**
   * Validate a single type field.
   */
  validateField: function(fieldSettings, item, next) {
    this.application.pick('field', fieldSettings.type, function(error, field) {
      if (error) {
        // Application error.
        return next(error);
      }
      if (!field || !field.validate) {
        // Field is of an unrecognized type or there's not a validate
        // callback.
        // @todo: log warning when type is not recognized.
        return next();
      }

      var errors = [];
      field.validate(fieldSettings, item, function(error, result) {
        if (error) {
          // Application error.
          return next(error);
        }

        if (result !== true && typeof result === 'string') {
          // Validation failed.
          errors = errors.concat(result);
        }

        next(null, errors);
      });
    });
  },

  filter: function(item, fields) {
    var typeSettings = this.type;

    // Allow fieldless resources, if the resource type has no fields, return the
    // unmodified resource.
    if (!typeSettings.polymorphic && !typeSettings.fields) {
      return item;
    }

    if (typeSettings.polymorphic) {
      var subTypeSettings = this.type.subtypes[item.type];

      // Get fields from subtype settings if type is polymorphic.
      fields = fields || Object.keys(subTypeSettings.fields);

      // Add "type" field so it don't get removed.
      fields.unshift('type');
    }
    else {
      // Get field from type from type settings.
      fields = fields || Object.keys(typeSettings.fields);
    }

    var newResource = {};
    fields.forEach(function(field) {
      if (field in item) {
        newResource[field] = item[field];
      }
    });

    return newResource;
  }

};
