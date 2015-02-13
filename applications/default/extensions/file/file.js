var path = require('path');
var fs = require('fs');
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
        title: 'Id',
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
        title: 'Size',
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

  function moveTemporaryFile(settings, fileId, file, next) {
    // @todo: move the file without reading it to memory for performance and
    // to avoid memory leaks.

    fs.readFile(file.path, function(error, data) {
      if (error) {
        return next(error);
      }

      // Create a new filename based on file ID and file extension.
      var fileName = fileId + path.extname(file.path);

      // Create a path for file based on field name and the new filename.
      var filePath = path.join(application.settings.applicationDir, 'public/files', settings.name, fileName);

      self.createPathAndSave(filePath, data, function(error) {
        if (error) {
          return next(error);
        }

        file.path = path.join(settings.name, fileName);
        file.temporary = false;
        file.save(next);
      });
    });
  };

  newFields['file'] = {
    title: 'File',
    schema: function(settings) {
      var schema = {};

      if (settings.multiple) {
        schema.collection = 'file';
      }
      else {
        schema.model = 'file';
      }

      return schema;
    },
    element: 'file',
    validate: function(settings, item, next) {
      var fileId = item[settings.name];

      if(!fileId && !settings.required) {
        return next(null, true);
      }

      if (settings.required && !fileId) {
        return next(null, 'is required');
      }

      application.load('file', fileId, function(error, file) {
        if (error) {
          return next(error);
        }

        if (!file) {
          return next(null, 'Error uploading the file');
        }

        return next(null, true);
      });
    },
    find: function(settings, query, next) {
      query.populate(settings.name);
      next();
    },
    beforeCreate: function(settings, item, next) {
      var fileId = item[settings.name];

      if (!fileId) {
        return next(null);
      };

      application.load('file', fileId, function(error, file) {
        if (error) {
          return next(error);
        }

        moveTemporaryFile(settings, fileId, file, next);
      });
    },
    beforeUpdate: function(settings, item, next) {
      var fileId = item[settings.name];

      if (!fileId) {
        return next(null);
      };

      application.load('file', fileId, function(error, file) {
        if (error) {
          return next(error);
        }

        // Verify if the file was updated.
        if (!file.temporary) {
          return next(null);
        }

        moveTemporaryFile(settings, fileId, file, next);
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

      application.type('file').save({
        filename: requestFile.originalname,
        filetype: requestFile.mimetype,
        size: parseInt(requestFile.size),
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
