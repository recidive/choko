var exampleContext = module.exports;

/**
 * The context() hook.
 */
exampleContext.context = function(contexts, callback) {
  var newContexts = {};

  newContexts['example-context'] = {
    title: "Example context",
    description: "Just a simple example context."
  };

  callback(null, newContexts);
};
