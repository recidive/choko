/*
 * Patch for Model class to add validation and sanitizing methods.
 */

var async = require('async');

var modelPatch = module.exports = {

  validateAndSave: function(item, callback) {
    var self = this;
    this.validate(item, function(error, errors) {
      if (error) {
        // Aplication error.
        return callback(error);
      }
      if (errors.length > 0) {
        // Validation errors.
        callback(null, item, errors);
      }
      else {
        self.save(self.filter(item), callback);
      }
    });
  },

  validate: function(item, callback) {
    var errors = [];
    var self = this;

    if (this.type.settings.polymorphic) {
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
      var fields = this.type.settings.fields || {};
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

      var Field = self.application.type('field');
      Field.load(fieldSettings.type, function(error, field) {
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

    }, function(error) {
      if (error) {
        // Application error.
        return callback(error);
      }
      callback(null, errors);
    });
  },

  filter: function(item, fields) {
    // Allow fieldless resources, if the resource type has no fields, return the
    // unmodified resource.
    if (!this.type.settings.fields) {
      return item;
    }

    fields = fields || Object.keys(this.type.settings.fields);

    var newResource = {};
    fields.forEach(function(field) {
      if (field in item) {
        newResource[field] = item[field];
      }
    });

    return newResource;
  }

};
