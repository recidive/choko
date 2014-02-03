var fs = require('fs');
var path = require('path');
var url = require('url');
var util = require('util');
var utils = require('prana').utils;

var installer = module.exports = {};

/**
 * The route() hook.
 */
installer.route = function(routes, callback) {
  var newRoutes = {};
  var application = this.application;

  newRoutes['/install-submit'] = {
    access: true,
    callback: function(request, response, callback) {
      var data = request.body;

      if (data.password != data['password-confirm']) {
        return callback(null, ['Passwords must match.'], 400);
      }

      // @todo: test database connection.

      // Recreate application settings
      var newSettings = {
        database: 'mongodb://' + data.databaseServer + '/' + data.databaseName,
        sessionSecret: require('crypto').randomBytes(32).toString('base64'),

        application: {
          name: data.name
        },

        extensions: {}
      };
      fs.writeFileSync(path.join(application.settings.applicationDir, '/settings.json'), JSON.stringify(newSettings, null, '  '), {flag: 'w'});

      // Copy values to a new user object so we can use it after the server
      // was restarted.
      var adminUser = {
        email: data.userEmail,
        username: data.username,
        password: data.password,
        roles: ['administrator']
      };

      var createAdminUser = function(app, callback) {
        // Create the administrator user.
        var User = app.type('user');
        var newAccount = new User(adminUser);
        newAccount.validateAndSave(function(error, newAccount, errors) {
          if (error) {
            return callback(error);
          }

          if (errors && errors.length > 0) {
            // Validation errors.
            return callback(null, errors, 400);
          }

          // Return the new created app settings.
          callback(null, newSettings, 201);
        });
      };

      var hostname = application.settings.hostname;

      // Re-start the server with new settings.
      application.server.restart(function(server) {
        var application = server.applications[hostname];

        util.log('Application "' + application.settings.application.name + '" started at "' + application.settings.hostname + '".');

        createAdminUser(application, callback);
      });
    }
  };


  callback(null, newRoutes);
};