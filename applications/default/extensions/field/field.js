var validator = require('validator/lib/validators');

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

  newFields['text'] = {
    title: 'Text',
    element: 'text'
  };
  newFields['number'] = {
    title: 'Number',
    element: 'number',
    validate: function(settings, item, next) {
      next(null, validator.isNumeric(item[settings.name]) || 'Invalid number.');
    }
  };
  newFields['email'] = {
    title: 'Email',
    element: 'email',
    validate: function(settings, item, next) {
      // Email validator oddly returns the email itself, so need to convert to
      // boolean.
      next(null, new Boolean(validator.isEmail(item[settings.name])) || 'Invalid email.');
    }
  };
  newFields['password'] = {
    title: 'Password',
    element: 'password',
    validate: function(settings, item, next) {
      var minLength = settings.minLength || 6;
      next(null, validator.len(item[settings.name], settings.minLength || 6) || 'Password must have at least ' + minLength + ' characters.');
    }
  };
  newFields['url'] = {
    title: 'URL',
    element: 'url',
    validate: function(settings, item, next) {
      next(null, validator.isUrl(item[settings.name]) || 'Invalid URL.');
    }
  };
  newFields['submit'] = {
    title: 'Submit',
    element: 'submit'
  };

  callback(null, newFields);
};
