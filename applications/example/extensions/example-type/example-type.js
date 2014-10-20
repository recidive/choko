var exampleType = module.exports;

/**
 * The type() hook.
 */
exampleType.type = function(types, callback) {
  var newTypes = {};

  // A basic article resource.
  newTypes['article'] = {
    title: 'Article',
    description: 'Articles are pieces of text with a title.',
    storage: 'database',
    keyProperty: 'id',
    fields: {
      id: {
        title: 'Id',
        type: 'id'
      },
      title: {
        title: 'Title',
        type: 'text',
        required: true
      },
      body: {
        title: 'Body',
        type: 'text',
        element: {
          type: 'wysiwyg'
        }
      },
      image: {
        title: 'Image',
        type: 'file'
      }
    },
    access: {
      'list': true,
      'load': true,
      'add': true,
      'edit': true,
      'delete': true
    }
  };

  callback(null, newTypes);
};

/**
 * The page() hook.
 */
exampleType.page = function(pages, callback) {
  var newPages = {};

  newPages['add-article'] = {
    path: '/add-article',
    type: 'form',
    title: 'Add article',
    formName: 'type-article'
  };

  callback(null, newPages);
};
