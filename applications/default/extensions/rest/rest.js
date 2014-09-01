var async = require('async');
var passport = require('passport');
var utils = require('prana').utils;

var rest = module.exports;

/**
 * The route() hook.
 */
rest.route = function(routes, callback) {
  var application = this.application;
  var newRoutes = {};

  var validationResponseCallback = function(callback) {
    return function(error, item, errors) {
      if (error) {
        // Application error.
        return callback(error);
      }
      if (errors && errors.length > 0) {
        // Validation errors.
        return callback(null, errors, 400);
      }
      // Validation passed.
      callback(null, item);
    };
  };

  // Helper function for performing HTTP Basic authentication.
  var basicAuth = function(request, response, callback) {
    passport.authenticate('basic', function(error, account) {
      if (error) {
        return callback(error);
      }

      if (!account) {
        return callback(null, ['Invalid username or password.'], 401);
      }

      // Log user in.
      request.login(account, function(error) {
        if (error) {
          return callback(error);
        }
        callback(null, account);
      });

    })(request, response, callback);
  };

  var self = this;
  async.each(Object.keys(this.application.types), function(typeName, next) {
    var typeModel = self.application.types[typeName];
    var type = typeModel.type;

    // Default path to type name.
    if (!type.path) {
      type.path = '/' + type.name;
    }

    // Initialize access rules.
    type.settings.access = type.settings.access || {};

    // Add default access rules.
    var access = {
      'list': false,
      'load': false,
      'add': false,
      'edit': false,
      'delete': false
    };
    utils.extend(access, type.settings.access);

    // Helper function that receives a HTTP method/Model method mapper and run
    // the appropriate access checks.
    var accessHelper = function(methodMapper, request, response, callback) {
      var modelMethod = methodMapper[request.method];
      if (access[modelMethod] === true) {
        return callback(null, true);
      }

      // Run basic auth authentication.
      basicAuth(request, response, function(error, account) {
        if (!account) {
          return callback(null, false);
        }
        if (request.method in methodMapper) {
          return application.access(request, access[modelMethod], callback);
        }
        callback();
      });
    };

    // List or add items.
    newRoutes['/rest' + type.path] = {
      callback: function(request, response, callback) {
        if (request.method == 'GET') {
          // @todo: filter out dangerous stuff from query before passing it to
          // list() method?
          var query = request.query;
          return application.invoke('query', type, query, request, function() {
            typeModel.list(query, callback);
          });
        }
        if (request.method == 'POST') {
          return typeModel.validateAndSave(request.body, validationResponseCallback(callback));
        }
        callback();
      },
      access: function(request, response, callback) {
        var methodMapper = {
          'GET': 'list',
          'POST': 'add'
        };
        accessHelper(methodMapper, request, response, callback);
      }
    };

    // Get, update or delete an item.
    newRoutes['/rest' + type.path + '/:' + type.name] = {
      callback: function(request, response, callback) {
        if (request.method == 'GET') {
          return typeModel.load(request.params[type.name], callback);
        }
        if (request.method == 'PUT') {
          return typeModel.validateAndSave(request.body, validationResponseCallback(callback));
        }
        if (request.method == 'POST' || request.method == 'PATCH') {
          return typeModel.load(request.params[type.name], function(err, item) {
            if (item) {
              // Delete MongoDB ID if any.
              delete item._id;
              utils.extend(item, request.body);
              request.body = item;
            }
            typeModel.validateAndSave(request.body, validationResponseCallback(callback));
          });
        }
        if (request.method == 'DELETE') {
          return typeModel.delete(request.params[type.name], callback);
        }
        callback();
      },
      access: function(request, response, callback) {
        var methodMapper = {
          'GET': 'load',
          'PUT': 'edit',
          'POST': 'edit',
          'PATCH': 'edit',
          'DELETE': 'delete'
        };
        accessHelper(methodMapper, request, response, callback);
      }
    };
    next();
  }, function(err) {
    callback(null, newRoutes);
  });
};
