var examplePanel = module.exports;

/**
 * The panel() hook.
 */
examplePanel.panel = function(panels, callback) {
  var newPanels = {};

  newPanels['example-panel'] = {
    title: 'Example panel',
    description: 'Just an example panel.',
    style: 'danger',
    content: '</p>Hello</p>'
  };

  callback(null, newPanels);
};

/**
 * The context() hook.
 */
examplePanel.context = function(contexts, callback) {
  // Create the array of panels for the sidebar region if it isn't there yet.
  contexts['global'].reactions.panel['sidebar'] = contexts['global'].reactions.panel['sidebar'] || [];

  // Add our navigation panel to the global context and sidenar region.
  contexts['global'].reactions.panel['sidebar'].push({
    name: 'example-panel',
    weight: 0
  });

  callback();
};
