/*
 * Choko installer.
 */

var fs = require('fs');
var path = require('path');
var util = require('util');
var prompt = require('prompt');
var colors = require('colors');
var validator = require('validator');
var crypto = require('crypto');
var Application = require('../lib/application');

/**
 * Run a questionnaire for interactively configuring the new application.
 */
function install(destination, prg, callback) {
  prompt.start();

  prompt.message = ':'.white.bold.bgBlack;
  prompt.delimiter = ': '.white.bold.bgBlack;

  var schema = {
    properties: {
      appName: {
        description: 'Application name'.white.bold.bgBlack,
        pattern: /^[a-zA-Z0-9\s\-]+$/,
        message: 'Application name must be only letters, spaces, or dashes',
        default: path.basename(destination),
        required: true
      },
      appEmail: {
        description: 'Application email address'.white.bold.bgBlack,
        conform: validator.isEmail,
        message: 'Enter a valid email',
        required: true
      },
      adminName: {
        description: 'Administrator username'.white.bold.bgBlack,
        conform: validator.isAlphanumeric,
        default: 'admin',
        message: 'Enter a valid username e.g. admin',
        required: true
      },
      adminPass: {
        description: 'Administrator password (at least 6 characters)'.white.bold.bgBlack,
        hidden: true,
        conform: function (pass) {
          return validator.isLength(pass, 6);
        },
        message: 'Password must have at least 6 characters.',
        required: true
      },
      adminEmail: {
        description: 'Administrator email address'.white.bold.bgBlack,
        conform: validator.isEmail,
        message: 'Enter a valid email',
        required: true
      },
      database: {
        description: 'Database URI'.white.bold.bgBlack,
        conform: function(uri) {
          return validator.isURL(uri, {
            protocols: ['mongodb'],
            require_protocol: true,
            allow_underscores: true
          });
        },
        default: 'mongodb://localhost/' + path.basename(destination),
        message: 'Enter a valid URI for your database e.g. mongodb://localhost/chokoapp',
        required: true
      }

    }
  };

  prompt.get(schema, function (error, result) {

    if (error) {
      return console.log('\nInstall aborted, no changes were made.');
    }

    doInstall({
      application: {
        name: result.appName,
        email: result.appEmail
      },
      database: result.database,
      sessionSecret: crypto.randomBytes(32).toString('base64')
    }, destination);

    var app = new Application(destination);
    app.start(prg.port, function(error, app) {
      if (error) {
        throw error;
      }

      createAdminUser(app, result, function(error, newAccount, errors) {
        // @todo: handle errors.
        util.log('Navigate to http://localhost:' + prg.port + ' to start building your new application.');
      });
    });
  });

}

/**
 * Create application folder structure and initial settings.
 */
function doInstall(settings, destination) {
  // Create application directories if they don't exist.
  var folders = [
    destination,
    path.join(destination, '/public'),
    path.join(destination, '/extensions')
  ];
  folders.forEach(function(folder) {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
  });

  // Create settings.json.
  fs.writeFileSync(path.join(destination, 'settings.json'), JSON.stringify(settings, null, '  '), {flag: 'w'});
}

/**
 * Create administrator user.
 */
function createAdminUser(app, result, callback) {
  // Create the admin user.
  var User = app.type('user');
  var userData = {
    username: result.adminName,
    password: result.adminPass,
    email: result.adminEmail,
    roles: ['administrator']
  };
  User.validateAndSave(userData, callback);
}

module.exports = install;
