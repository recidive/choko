/*
 * Patch for Model class to add validation and sanitizing methods.
 */

var async = require('async');
var utils = require('prana').utils;

var modelPatch = module.exports = {

  // Add legacy methods.
  save: function(data, callback) {
    if (!(this.primaryKey in data)) {
      // If there's no primary key, we may be creating an item that have an
      // 'internal' field as primery key.
      return this.create(data, callback);
    }

    var itemKey = data[this.primaryKey];
    var self = this;

    this.load(itemKey, function(error, item) {
      if (error) {
        return callback(error);
      }

      if (item) {
        // Update item. Extend the loaded object for saving it easily.
        utils.extend(item, data);

        // Remove properties not set on the updated object so they can be unset.
        for (var propName in item) {
          if (!(propName in data)) {
            delete item[propName];
          }
        }

        item.save(callback);
      }
      else {
        // Add item. We are allowing the primary key to be sent through.
        self.create(data, callback);
      }
    });
  },

  list: function(criteria, callback) {
    var self = this;
    var query = this.find().where(criteria);

    this.application.invoke('find', this.type.name, query, function(error, data) {
      if (error) {
        return callback(error);
      }

      query.exec(function(error, items) {
        if (error) {
          return callback(error);
        }

        // @todo: we convert from array to object since the front end is expecting
        // data this way. In the long run we may change this, so we can return
        // array to have better performance.
        var result = {};
        items.map(function(item) {
          var itemKey = item[self.primaryKey];
          result[itemKey] = item;
        });

        // Invoke operation hook on all extensions.
        self.application.invoke('list', self.type.name, result, function(error, data) {
          if (error) {
            return callback(error);
          }
          callback(null, result);
        });
      });

    });

  },

  load: function(criteria, callback) {
    var primaryKey = this.primaryKey;

    var query = {};
    if (typeof criteria === 'string') {
      query[primaryKey] = criteria;
    }
    else if (typeof criteria === 'object') {
      var query = criteria;
    }

    this.list(query, function(error, items) {
      if (error) {
        return callback(error);
      }

      // @todo: We may need to make sure the field is unique before returning
      // the item like that. If it's not, we may return the wrong item.
      callback(null, items[Object.keys(items).shift()]);
    });
  },

  delete: function() {
    this.destroy.apply(this, arguments);
  },

  validateAndSave: function(item, fields, callback) {
    var self = this;

    if (!callback) {
      callback = fields;
      fields = [];
    }

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
    }, null, fields);
  },

  _validate: function(item, callback, reference, validateFields) {
    var errors = [];
    var self = this;

    validateFields = validateFields || [];

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

    // Create a prefix for showing along with field validation errors.
    var prefix = reference ? self.application.type(reference.type).type.title : '';

    // Validate type fields.
    async.each(Object.keys(fields), function(fieldName, next) {
      if (validateFields.length > 0 && validateFields.indexOf(fieldName) === -1) {
        return next(null, true);
      }

      var fieldSettings = fields[fieldName];

      // Bypass validation of internal fields.
      if (fieldSettings.internal) {
        return next(null, true);
      }

      var allFieldErrors = [];

      // Add field name to field settings to be used by the field validation
      // callback to extract the field value from the item.
      // @todo in the long run we may want to add a typeField type to link the
      // type to its fields properly, so once type is loaded properly it will
      // have the name property set.
      fieldSettings.name = fieldName;

      var fieldFullName = (prefix ? prefix + ' - ' : '') + fieldSettings.title;

      // If field is required check if a value was supplied for it.
      if (fieldSettings.required && !(fieldName in item)) {
        errors.push(fieldFullName + ' is required.');
        return next(null, [fieldFullName + ' is required.']);
      }

      else if (!(fieldName in item)) {
        // The field doesn't have a value, so nothing to validate.
        return next(null, true);
      }

      var concatFieldErrors = function(error, fieldErrors) {
        if (error) {
          return next(error);
        }

        if (fieldErrors) {
          allFieldErrors = allFieldErrors.concat(fieldErrors);
        }

        allFieldErrors.forEach(function (error) {
          errors.push(fieldFullName + ' ' + error);
        });

        next();
      };

      // If field is unique check if a item with same value set is not present.
      if (fieldSettings.unique) {
        var query = {};
        query[fieldName] = item[fieldName];
        return self.application.load(self.type.name, query, function (error, existing) {
          if (error) {
            return next(error);
          }

          // If an item with the same value for this field and it is not the
          // same item as the one we are saving, fails validatiom.
          if (existing && (!(self.primaryKey in item) || (self.primaryKey in item && item[self.primaryKey] != existing[self.primaryKey]))) {
            allFieldErrors.push('must be unique.');
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
   * Validate a field instance.
   */
  validateField: function(field, item, next) {
    var self = this;

    this.application.pick('field', field.type, function(error, fieldType) {
      if (error) {
        // Application error.
        return next(error);
      }

      if (!field.validate) {
        return self.validateFieldType(field, fieldType, item, next);
      }

      var errors = [];
      field.validate(field, fieldType, item, function (error, result) {
        if (error) {
          // Processing error.
          return next(error);
        }

        if (result !== true && (result instanceof Array || typeof result === 'string')) {
          // Validation failed.
          errors = errors.concat(result);
        }

        self.validateFieldType(field, fieldType, item, function (error, result) {
          if (error) {
            // Processing error.
            return next(error);
          }

          if (result instanceof Array) {
            // Validation failed.
            errors = errors.concat(result);
          }

          next(null, errors);
        });
      });
    });
  },

  /**
   * Validate the field type.
   */
  validateFieldType: function (field, fieldType, item, next) {
    if (!fieldType || !fieldType.validate) {
      // Field is of an unrecognized type or there's not a validate
      // callback.
      // @todo: log warning when type is not recognized.
      return next();
    }

    fieldType.validate(field, item, function(error, result) {
      if (error) {
        // Application error.
        return next(error);
      }

      // Always return errors in an array format.
      next(null, [].concat((result instanceof Array || typeof result === 'string') ? result : []));
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
