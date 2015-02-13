var content = module.exports;

/**
 * The type() hook.
 */
content.type = function(types, callback) {
  // Declare content main type lifecycle callbacks.
  var type = types['content'];

  type.beforeCreate = function(settings, data, next) {
    // Set created and update dates to now.
    // @todo: Allow created/updated date to be passed in some circunstances,
    // e.g. admin, import/export, etc.
    data.created = new Date;
    data.updated = new Date;
    next();
  };

  type.beforeUpdate = function(settings, data, next) {
    // Set updated date to now.
    // @todo: Allow created date to be passed in some circunstances, e.g. admin,
    // import/export, etc.
    data.updated = new Date;
    next();
  };

  callback();
}
