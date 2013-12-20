var async = require('async');
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

  var self = this;
  async.each(Object.keys(this.application.types), function(typeName, next) {
    var typeModel = self.application.types[typeName];
    var type = typeModel.type;

    // Default path to type name.
    if (!type.path) {
      type.path = '/' + type.name;
    }

    // List or add items.
    newRoutes['/rest' + type.path] = {
      access: true,
      callback: function(request, response, callback) {
        if (request.method == 'GET') {
          return typeModel.list(request.query, callback);
        }
        if (request.method == 'POST') {
          return typeModel.validateAndSave(request.body, validationResponseCallback(callback));
        }
        callback();
      }
    };

    // Get, update or delete an item.
    newRoutes['/rest' + type.path + '/:' + type.name] = {
      access: true,
      callback: function(request, response, callback) {
        if (request.method == 'GET') {
          return typeModel.load(request.params[type.name], callback);
        }
        if (request.method == 'PUT') {
          return typeModel.validateAndSave(request.body, validationResponseCallback(callback));
        }
        if (request.method == 'POST') {
          return typeModel.load(request.params[type.name], function(err, item) {
            if (item) {
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
      }
    };
    next();
  }, function(err) {
    callback(null, newRoutes);
  });
};
