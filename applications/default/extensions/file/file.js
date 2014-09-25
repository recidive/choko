var path = require('path');
var fs = require('fs');
var validator = require('validator/lib/validators');
var utils = require('prana').utils;

var file = module.exports = {};

/**
 * The type() hook.
 */
file.type = function(types, callback) {
  var newTypes = {};

  newTypes['file'] = {
    title: 'File',
    description: 'A file stored on the filesystem.',
    storage: 'database',
    fields: {
      id: {
        type: 'id',
        title: 'Name',
        internal: true
      },
      filename: {
        type: 'text',
        title: 'Name',
        internal: true
      },
      filetype: {
        type: 'text',
        title: 'Type',
        internal: true
      },
      size: {
        type: 'number',
        title: 'size',
        internal: true
      },
      path: {
        type: 'text',
        title: 'Path',
        internal: true
      },
      temporary: {
        type: 'boolean',
        title: 'Temporary',
        internal: true
      }
    },
    keyProperty: 'id',
    access: {
      'list': true,
      'load': true,
      'add': false,
      'edit': false,
      'delete': false
    }
  };

  callback(null, newTypes);
};

/**
 * The field() hook.
 */
file.field = function(fields, callback) {
  var application = this.application;
  var newFields = {};
  var self = this;

  newFields['file'] = {
    title: 'File',
    schema: 'string',
    element: 'file',
    validate: function(settings, item, next) {
      var fileId = item[settings.name];
      application.load('file', fileId, function(error, file) {
        if (error) {
          return next(error);
        }
        if (file && file.temporary) {
          return next(null, true);
        }
        next(null, 'Invalid file identifier.');
      });
    },
    preSave: function(settings, item, next) {
      var fileId = item[settings.name];
      application.load('file', fileId, function(error, file) {
        if (error) {
          return next(error);
        }

        fs.readFile(file.path, function(error, data) {
          if (error) {
            return next(error);
          }

          var filePath = path.join(application.settings.applicationDir, 'public/files', settings.name, file.filename);
          self.createPathAndSave(filePath, data, function(error) {
            file.path = file.filename;
            file.temporary = false;
            next();
          });
        });
      });
    }
  };

  callback(null, newFields);
};

/**
 * The route() hook.
 */
file.route = function(routes, callback) {
  var newRoutes = {};
  var application = this.application;

  newRoutes['/file'] = {
    access: 'upload files',
    callback: function(request, response, callback) {
      var requestFile = request.files.file; 

      var File = application.type('file');
      File.validateAndSave({
        filename: requestFile.name,
        filetype: requestFile.type,
        size: requestFile.size,
        path: requestFile.path,
        temporary: true
      },
      function(error, file) {
        if (error) {
          return callback(error);
        }

        // Pass only the id that's what we need for now.
        callback(null, {
          id: file.id
        });
      });
    }
  };

  callback(null, newRoutes);
};

/**
 * Create path structure for the file if needed and save the file.
 */
file.createPathAndSave = function(filePath, data, callback) {
  var dirName = path.dirname(filePath);
  fs.exists(dirName, function(exists) {
    // @todo: check for existing file with same name and rename file with
    // a number suffix.
    if (exists) {
      fs.writeFile(filePath, data, callback);
    }
    else {
      utils.mkdir(dirName, function(error) {
        if (error) {
          return callback(error);
        }
        fs.writeFile(filePath, data, callback);
      });
    }
  });
};
