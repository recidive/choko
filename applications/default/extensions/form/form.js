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
    fields: {
      name: {
        title: 'Name',
        type: 'text',
        required: true
      },
      title: {
        title: 'Title',
        type: 'text',
        required: true
      }
    },
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

  // Create forms for every type on the system except the ones that have no
  // fields and the ones that are polymorphic.
  async.each(Object.keys(self.application.types), function(typeName, next) {
    var typeSettings = self.application.types[typeName];
    if (!typeSettings.fields || typeSettings.polymorphic) {
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

      if (!(fieldSettings.type in self.application.fields)) {
        // @todo: log warning that field doesn't exist.
        return next();
      }

      var field = self.application.fields[fieldSettings.type];
      var element = {};

      // Start with field type defaults
      if (field.element) {
        switch (typeof field.element) {

          // If element is a string it's the elememt type.
          case 'string':
            element.type = field.element;
            break;

          // If element is a object it's the element settings object.
          case 'object':
            utils.extend(element, field.element);
            break;

          // If element is a function run it to get the element settings
          // object.
          case 'function':
            utils.extend(element, field.element(fieldSettings));
            break;
        }
      }

      // Add basic properties.
      utils.extend(element, {
        name: fieldName,
        title: fieldSettings.title || null,
        description: fieldSettings.description || null,
        required: fieldSettings.required || false,
        weight: fieldSettings.weight || 0
      });

      // Add field options for select and other types if any.
      if (fieldSettings.options) {
        element.options = fieldSettings.options;
      }

      // Forward 'multiple' property.
      if (fieldSettings.multiple) {
        element.multiple = fieldSettings.multiple;
      }

      // Bypass 'internal' fields.
      if (fieldSettings.internal) {
        return next();
      }

      // Bypass not 'inline' fields with 'via' set.
      // @todo: eventually we may want to edit this kind of fields when editing
      // the main item too.
      if (fieldSettings.type == 'reference' && 'reference' in fieldSettings && 'via' in fieldSettings.reference) {
        return next();
      }

      if (fieldSettings.type == 'reference') {
        element.reference = fieldSettings.reference;

        // Check if referenced type is polymorphic, if so, we need to send the
        // referenced types.
        var referencedType = self.application.types[fieldSettings.reference.type];
        if (referencedType && referencedType.polymorphic) {
          element.reference.subtypes = Object.keys(referencedType.subtypes).map(function(subtype) {
            return {
              name: subtype + utils.capitalizeFirstLetter(fieldSettings.reference.type),
              shortName: subtype,
              title: referencedType.subtypes[subtype].title
            };
          });
        }
      }

      if (fieldSettings.element) {
        if (typeof fieldSettings.element == 'string') {
          // Allow a string as element property value in this case this will be
          // the element type.
          element.type = fieldSettings.element;
        }
        else {
          // Merge in element settings.
          utils.extend(element, fieldSettings.element);
        }
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
          classes: ['btn-primary'],
          weight: 50
        });
      }
      next();
    });
  }, function() {
    callback(null, newForms);
  });

};
