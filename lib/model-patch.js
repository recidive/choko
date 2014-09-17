/*
 * Patch for Model class to add validation and sanitizing methods.
 */

var async = require('async');
var utils = require('prana').utils;

var modelPatch = module.exports = {

  // Add legacy methods.
  save: function(data, callback) {
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
    var primaryKey = this.primaryKey;

    this.find(criteria, function(error, items) {
      if (error) {
        return callback(error);
      }

      // @todo: we convert from array to object since the front end is expecting
      // data this way. In the long run we may change this, so we can return
      // array to have better performance.
      var result = {};
      items.map(function(item) {
        var itemKey = item[primaryKey];
        result[itemKey] = item;
      });
      callback(null, result);
    });
  },

  load: function(key, callback) {
    this.findOne(key, callback);
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
      else if (!(item.type in this.subtypes)) {
        errors.push('Error: unrecognized type: ' + item.type + '.');
        return callback(null, errors);
      }
      // Get field for polymorphic type subtypes.
      var fields = this.subtypes[item.type].type.settings.fields || {};
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

      self.application.pick('field', fieldSettings.type, function(error, field) {
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

        field.validate(fieldSettings, item, function(error, result) {
          if (error) {
            // Application error.
            return next(error);
          }

          if (result !== true && typeof result === 'string') {
            // Validation failed.
            errors = errors.concat(result);
          }

          next();
        });
      });

    },
    function(error) {
      if (error) {
        // Application error.
        return callback(error);
      }
      callback(null, errors);
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
      var subTypeSettings = this.subtypes[item.type].type.settings;

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
