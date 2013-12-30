var examplePage = module.exports;

/**
 * The page() hook.
 */
examplePage.page = function(pages, callback) {
  var newPages = {};

  newPages['an-example-page'] = {
    path: '/an-example-page',
    title: 'An example page',
    content: '<h1>Some title</h1><p class="lead">Here is some copy lead text.</p><p>Here is a normal body copy text.</p>'
  };

  callback(null, newPages);
};
