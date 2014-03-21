var async = require('async');
var utils = require('prana').utils;

var form = module.exports;

/**
 * The permission() hook.
 */
form.permission = function(permissions, callback) {
  var newPermissions = {};

  newPermissions['manage-forms'] = {
    title: 'Manage forms',
    description: 'List, create and edit forms.'
  };

  callback(null, newPermissions);
};

/**
 * The type() hook.
 */
form.type = function(types, callback) {
  var newTypes = {};

  newTypes['form'] = {
    title: 'Form',
    description: 'Structures that can be rendered as forms.',
    access: {
      // @todo: 'list' and 'load' should take into account form permissions.
      'list': true,
      'load': true,
      'add': 'manage-forms',
      'edit': 'manage-forms',
      'delete': 'manage-forms'
    }
  };

  callback(null, newTypes);
};

/**
 * The form() hook.
 */
form.form = function(forms, callback) {
  var newForms = {};
  var self = this;

  // Create forms for every type on the system except 'type' and 'extension',
  // the ones that have the 'form' property set to false, the ones that have
  // no fields and the ones that are polymorphic.
  async.each(Object.keys(self.application.types), function(typeName, next) {
    var typeSettings = self.application.types[typeName].type.settings;
    if (typeName == 'type' || typeName == 'extension' || !typeSettings.fields || typeSettings.polymorphic) {
      return next();
    }
    var form = newForms['type-' + typeName] = {
      title: typeSettings.formTitle || typeSettings.title,
      description: 'Form for the ' + typeSettings.title + ' type.',
      typeName: typeName
    };

    if (typeSettings.mainTypeName) {
      form.mainTypeName = typeSettings.mainTypeName
    }

    if (typeSettings.shortName) {
      form.shortName = typeSettings.shortName
    }

    // Add fields.
    form.elements = [];
    async.eachSeries(Object.keys(typeSettings.fields), function(fieldName, next) {
      var fieldSettings = typeSettings.fields[fieldName];
      // By pass 'internal' fields.
      if (fieldSettings.internal) {
        return next();
      }
      var element = {
        name: fieldName,
        title: fieldSettings.title || null,
        description: fieldSettings.description || null,
        // Default type to field type. This can be overriden with element
        // property.
        type: fieldSettings.type,
        required: fieldSettings.required || false,
        weight: fieldSettings.weight || 0
      };

      // Add field options for select and other types if any.
      if (fieldSettings.options) {
        element.options = fieldSettings.options;
      }

      if (fieldSettings.type == 'reference') {
        element.reference = fieldSettings.reference;

        // Check if referenced type is polymorphic, if so, we need to send the
        // referenced types.
        var referencedType = self.application.type(fieldSettings.reference.type);
        if (referencedType && referencedType.type.settings.polymorphic) {
          element.reference.subtypes = Object.keys(referencedType.subtypes).map(function(subtype) {
            return {
              name: subtype + utils.capitalizeFirstLetter(fieldSettings.reference.type),
              shortName: subtype,
              title: referencedType.subtypes[subtype].type.settings.title
            };
          });
        }
      }

      if (fieldSettings.element) {
        // Merge in element settings.
        utils.extend(element, fieldSettings.element);
      }

      form.elements.push(element);
      next();
    }, function() {
      // The standalone setting says the the type can't exist on its own, and
      // its form is usually used on subforms on reference type fields.
      if (typeSettings.standalone !== false) {
        form.elements.push({
          name: 'submit',
          title: 'Save',
          type: 'submit',
          url: '/rest/' + (typeSettings.mainTypeName || typeName),
          classes: ['btn-primary'],
          weight: 15
        });
      }
      next();
    });
  }, function() {
    callback(null, newForms);
  });

};
