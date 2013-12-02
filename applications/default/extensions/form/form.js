var form = module.exports;

/**
 * The type() hook.
 */
form.type = function(types, callback) {
  var newTypes = {};

  newTypes['form'] = {
    title: 'Form',
    description: 'Structures that can be rendered as forms.'
  };

  callback(null, newTypes);
};
