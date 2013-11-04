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
    path: 'article',
    //storage: 'memory',
    //storage: 'database',
    // @todo: figure out a better way for passing the database connection to
    // the storage controller.
    //database: this.application.database,
    //data: data,
    fields: {
      id: {
        title: 'Id',
        type: 'number'
      },
      title: {
        title: 'Title',
        type: 'text',
        required: true
      },
      body: {
        title: 'Body',
        type: 'text'
      }
    }
  };

  callback(null, newTypes);
};
