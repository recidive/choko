/*
 * The Content Management extension.
 */

var contentManagement = module.exports;

/**
 * The page() hook.
 */
contentManagement.page = function(pages, callback) {
  var self = this;
  var newPages = {};

  // Create form contents for all content subtypes.
  var contentTypes = this.application.types['content'].subtypes;
  for (var subtypeName in contentTypes) {
    var subtypeSettings = contentTypes[subtypeName];
    newPages['manage-content-add-' + subtypeSettings.name] = {
      path: '/manage/content/add-' + subtypeSettings.name,
      title: 'Add ' + subtypeSettings.title.toLowerCase(),
      type: 'form',
      formName: 'type-' + subtypeSettings.name + 'Content',
      redirect: '/manage/content'
    };
  }

  callback(null, newPages);
};

/**
 * The navigation() hook.
 */
contentManagement.navigation = function(navigations, callback) {
  var newNavigations = {};

  // Create navigation dropdown with links for all content types forms.
  var contentTypes = this.application.types['content'].subtypes;
  var items = [];
  for (var contentTypeName in contentTypes) {
    var contentTypeSettings = contentTypes[contentTypeName];
    items.push({
      title: contentTypeSettings.title,
      url: '/manage/content/add-' + contentTypeSettings.name
    });
  }

  newNavigations['content-management-toolbar'] = {
    title: 'Content management toolbar',
    template: '/templates/btn-group.html',
    classes: [
      'btn-group-sm'
    ],
    items: [
      {
        type: 'dropdown',
        title: 'Add',
        items: items,
        classes: [
          'btn-primary'
        ]
      }
    ]
  };

  callback(null, newNavigations);
};
