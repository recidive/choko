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
      },
      category: {
        title: 'Category',
        type: 'text',
        options: {
          'sports': 'Sports',
          'politics': 'Politics'
        },
        multiple: true,
        required: true
      },
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
    formName: 'type-article',
    itemType: 'article',
    redirect: '/edit-article/[id|item]'
  };
  newPages['edit-article'] = {
    path: '/edit-article/:id',
    type: 'form',
    title: 'Edit article',
    formName: 'type-article',
    itemType: 'article'
  };

  callback(null, newPages);
};
