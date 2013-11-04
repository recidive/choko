var async = require('async');
var utils = require('prana').utils;

var rest = module.exports;

/**
 * The route() hook.
 */
rest.route = function(routes, callback) {
  var application = this.application;
  var newRoutes = {};

  var self = this;
  async.each(Object.keys(this.application.types), function(typeName, next) {
    var typeModel = self.application.types[typeName];
    var type = typeModel.type;

    // Default path to tyoe name.
    if (!type.path) {
      type.path = '/' + type.name;
    }

    // List or add items.
    newRoutes[type.path] = {
      access: true,
      callback: function(request, response, callback) {
        if (request.method == 'GET') {
          return typeModel.list(request.query, callback);
        }
        if (request.method == 'POST') {
          return typeModel.save(request.body, callback);
        }
        callback();
      }
    };

    // Get, update or delete an item.
    newRoutes[type.path + '/:' + type.name] = {
      access: true,
      callback: function(request, response, callback) {
        if (request.method == 'GET') {
          return typeModel.load(request.params[type.name], callback);
        }
        if (request.method == 'PUT') {
          return typeModel.save(request.body, callback);
        }
        if (request.method == 'POST') {
          return typeModel.load(request.params[type.name], function(err, item) {
            if (item) {
              utils.extend(item, request.body);
              request.body = item;
            }
            typeModel.save(request.body, callback);
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
