var path = require('path');
var fs = require('fs');
var utils = require('prana').utils;

var adapterMethods = module.exports = function(application) {
  return {
    create: function (connection, collection, data, callback) {
      var saveToFile = function(filePath, data, callback) {
        fs.writeFile(filePath, JSON.stringify(data, null, '  '), function(error) {
          if (error) {
            return callback(error);
          }
          callback(null, data);
        });
      };

      var overridesDir = path.join(application.settings.applicationDir, 'overrides', collection);

      fs.exists(overridesDir, function(exists) {
        var type = application.type(collection);
        var filePath = path.join(overridesDir, data[type.primaryKey] + '.' + collection + '.json');

        if (exists) {
          saveToFile(filePath, data, callback);
        }
        else {
          utils.mkdir(overridesDir, function(error) {
            if (error) {
              return callback(error);
            }
            saveToFile(filePath, data, callback);
          });
        }
      });
    },

    update: function (connection, collection, options, values, callback) {
      // @todo: update a 'static' item or create or update an override.
      callback(null, values);
    },

    destroy: function (connection, collection, options, callback) {
      // @todo: delete a 'static' item or an override.
      callback(null, values);
    }
  };
};
