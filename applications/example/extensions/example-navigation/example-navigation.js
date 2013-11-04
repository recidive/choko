var exampleNavigation = module.exports;

/**
 * The navigation() hook.
 */
exampleNavigation.navigation = function(navigations, callback) {
  var newNavigations = {};

  newNavigations['example-navigation'] = {
    title: 'Example navigation',
    items: [
      {
        title: 'Nav item 1',
        url: 'test1'
      },
      {
        title: 'Nav item 2',
        url: 'test2'
      },
    ]
  };

  callback(null, newNavigations);
};

/**
 * The context() hook.
 */
exampleNavigation.context = function(contexts, callback) {
  // Create the array of panels for the sidebar region if it isn't there yet.
  contexts['global'].reactions.panel['sidebar'] = contexts['global'].reactions.panel['sidebar'] || [];

  // Add our navigation panel to the global context and sidebar region.
  contexts['global'].reactions.panel['sidebar'].push({
    name: 'navigation-example-navigation',
    weight: 0
  });

  callback();
};
