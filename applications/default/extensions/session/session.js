var expressSession = require('express-session');
var ChokoStore = require('./lib/choko-store');
var flash = require('connect-flash');

var session = module.exports;

/**
 * The init() hook.
 */
session.init = function(application, callback) {

  application.application.use(expressSession({
    store: new ChokoStore(application),
    secret: application.settings.sessionSecret,
    resave: true,
    saveUninitialized: true
  }));

  // Enable flash messages.
  application.application.use(flash());

  // Call init() callback.
  callback();
};

/**
 * The type() hook.
 */
session.type = function(types, callback) {
  var newTypes = {};

  newTypes['session'] = {
    title: 'Session',
    description: 'Session data.',
    storage: 'database',
    keyProperty: 'hash',
    fields: {
      hash: {
        title: 'Hash',
        type: 'text',
        required: true
      },
      time: {
        title: 'Time',
        // @todo: change to appropriate date/time field.
        type: 'text',
        required: true
      },
      data: {
        title: 'Data',
        // @todo: change to appropriate serialized/mixed field.
        type: 'text',
        required: true
      }
    }
  };

  callback(null, newTypes);
};
