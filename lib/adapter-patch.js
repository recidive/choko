var path = require('path');
var fs = require('fs');
var utils = require('prana').utils;

var adapterMethods = module.exports = function(application) {
  return {
    create: function (connection, collection, data, callback) {
      var type = application.type(collection);
      var overridesDir = path.join(application.settings.applicationDir, 'overrides', collection);

      var saveToFile = function(data, callback) {
        var key = data[type.primaryKey];
        var filePath = path.join(overridesDir, key + '.' + collection + '.json');

        // Remove key as it's already in the filename.
        delete data[type.primaryKey];

        fs.writeFile(filePath, JSON.stringify(data, null, '  '), function(error) {
          if (error) {
            return callback(error);
          }

          // Re-add key as someone else may be expecting it.
          data[type.primaryKey] = key;
          callback(null, data);
        });
      };

      fs.exists(overridesDir, function(exists) {
        if (exists) {
          saveToFile(data, callback);
        }
        else {
          utils.mkdir(overridesDir, function(error) {
            if (error) {
              return callback(error);
            }
            saveToFile(data, callback);
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
