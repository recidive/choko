var async = require('async');
var validator = require('validator/lib/validators');
var uuid = require('node-uuid');

var field = module.exports = {};

/**
 * The type() hook.
 */
field.type = function(types, callback) {
  var newTypes = {};

  newTypes['field'] = {
    title: 'Field',
    description: 'Fields add schema to types and provide validation and output sanitizing.',
    access: {
      'list': true,
      'load': true,
      'add': false,
      'edit': false,
      'delete': false
    },
  };

  callback(null, newTypes);
};

/**
 * The field() hook.
 */
field.field = function(fields, callback) {
  var newFields = {};

  newFields['id'] = {
    title: 'Identifier',
    description: 'A Universally unique identifier.',
    preSave: function(settings, item, next) {
      if (!(settings.name in item)) {
        // Generate an UUID v4.
        item[settings.name] = uuid.v4();
      }
      next();
    }
  };
  newFields['text'] = {
    title: 'Text',
    element: 'text',
    validate: function(settings, item, next) {
      // Default minLenght to 1.
      settings.minLength = settings.minLength || 1;

      // Default maxLenght to 256.
      settings.maxLength = settings.maxLength || 256;

      next(null, !validator.notEmpty(item[settings.name]) || validator.len(item[settings.name].toString(), settings.minLength, settings.maxLength) || 'Value must have from ' + settings.minLength + ' to ' + settings.maxLength + ' characters.');
    }
  };
  newFields['number'] = {
    title: 'Number',
    element: 'number',
    validate: function(settings, item, next) {
      next(null, validator.isNumeric(item[settings.name].toString()) || 'Invalid number.');
    }
  };
  newFields['date'] = {
    title: 'Date',
    element: 'date',
    validate: function(settings, item, next) {
      next(null, validator.isDate(item[settings.name].toString()) || 'Invalid date.');
    }
  };
  newFields['email'] = {
    title: 'Email',
    element: 'email',
    validate: function(settings, item, next) {
      // Email validator oddly returns the email itself, so need to convert to
      // boolean.
      next(null, new Boolean(validator.isEmail(item[settings.name].toString())) || 'Invalid email.');
    }
  };
  newFields['password'] = {
    title: 'Password',
    element: 'password',
    validate: function(settings, item, next) {
      var minLength = settings.minLength || 6;
      next(null, validator.len(item[settings.name].toString(), settings.minLength || 6) || 'Password must have at least ' + minLength + ' characters.');
    }
  };
  newFields['url'] = {
    title: 'URL',
    element: 'url',
    validate: function(settings, item, next) {
      next(null, validator.isUrl(item[settings.name].toString()) || 'Invalid URL.');
    }
  };
  newFields['submit'] = {
    title: 'Submit',
    element: 'submit'
  };

  callback(null, newFields);
};

/**
 * The preSave() hook.
 */
field.preSave = function(type, data, callback) {
  var application = this.application;

  if (type.settings.fields) {
    // Validate type fields.
    async.each(Object.keys(type.settings.fields), function(fieldName, next) {
      var fieldSettings = type.settings.fields[fieldName];

      // Add fieldName to fieldSettings.
      fieldSettings.name = fieldName;

      var Field = application.type('field');
      Field.load(fieldSettings.type, function(error, field) {
        if (error) {
          // Application error.
          return next(error);
        }
        if (!field || !field.preSave) {
          // Field is of an unrecognized type or there's not a preSave()
          // callback.
          return next();
        }

        field.preSave(fieldSettings, data, function(error, result) {
          if (error) {
            // Application error.
            return next(error);
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
      callback();
    });
  }
  else {
    callback();
  }
};
