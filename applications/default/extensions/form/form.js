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

/**
 * The form() hook.
 */
form.form = function(forms, callback) {
  var newForms = {};

  // Create forms for every type on the system except 'type' and 'extension',
  // the ones that have the 'form' property set to false and the ones that have
  // no fields.
  for (var typeName in this.application.types) {
    var typeSettings = this.application.types[typeName].type.settings;
    if (typeName != 'type' && typeName != 'extension' && typeSettings.fields) {
      var form = newForms['type-' + typeName] = {
        title: typeSettings.title,
        description: 'Form for the ' + typeSettings.title + ' type.'
      };
      // Add fields.
      form.elements = [];
      for (var fieldName in typeSettings.fields) {
        var fieldSettings = typeSettings.fields[fieldName];
        if (typeof fieldSettings.type === 'string') {
          form.elements.push({
            name: fieldName,
            title: fieldSettings.title,
            // @todo: don't relate field types with element types directly.
            type: fieldSettings.type,
            required: fieldSettings.required || false,
            weight: fieldSettings.weight || 0,
          });
        }
      }
      form.elements.push({
        name: 'submit',
        title: 'Save',
        type: 'submit',
        url: '/rest/' + typeName,
        weight: 15
      });
    }
  }

  callback(null, newForms);
};
