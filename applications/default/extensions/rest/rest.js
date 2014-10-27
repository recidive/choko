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

  async.each(Object.keys(application.types), function(typeName, next) {
    var type = application.types[typeName];
    var typeModel = application.type(typeName);

    // Default path to type name.
    if (!type.path) {
      type.path = '/' + typeName;
    }

    // Initialize access rules.
    type.access = type.access || {};

    // Add default access rules.
    var access = {
      'list': false,
      'load': false,
      'add': false,
      'edit': false,
      'delete': false
    };
    utils.extend(access, type.access);

    // Helper function that receives a HTTP method/Model method mapper and run
    // the appropriate access checks.
    var accessHelper = function(methodMapper, request, response, callback) {
      var modelMethod = methodMapper[request.method];
      if (access[modelMethod] === true) {
        return callback(null, true);
      }

      return application.access(request, access[modelMethod], callback);
    };

    // List or add items.
    newRoutes['/rest' + type.path] = {
      middleware: passport.authenticate(['basic', 'anonymous']),
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
          // Remove key property to prevent updating.
          if (type.keyProperty in request.body) {
            delete request.body[type.keyProperty];
          }

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
      },
      router: 'rest'
    };

    // Get, update or delete an item.
    var paramName = utils.hyphensToCamelCase(typeName);
    newRoutes['/rest' + type.path + '/:' + paramName] = {
      middleware: passport.authenticate(['basic', 'anonymous']),
      callback: function(request, response, callback) {
        if (request.method == 'GET') {
          return typeModel.load(request.params[paramName], callback);
        }
        if (request.method == 'PUT') {
          return typeModel.validateAndSave(request.body, validationResponseCallback(callback));
        }
        if (request.method == 'POST' || request.method == 'PATCH') {
          return typeModel.load(request.params[paramName], function(error, item) {
            if (error) {
              return callback(error);
            }

            // Remove key property from incoming data to prevent updating the
            // wrong item.
            if (type.keyProperty in request.body) {
              delete request.body[type.keyProperty];
            }

            if (item) {
              utils.extend(item, request.body);
              request.body = item;
            }

            typeModel.validateAndSave(request.body, validationResponseCallback(callback));
          });
        }
        if (request.method == 'DELETE') {
          return typeModel.delete(request.params[paramName], callback);
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
      },
      router: 'rest'
    };
    next();
  }, function(err) {
    callback(null, newRoutes);
  });
};
