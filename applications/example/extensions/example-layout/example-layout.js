var exampleLayout = module.exports;

/**
 * The layout() hook.
 */
exampleLayout.layout = function(layouts, callback) {
  var newLayouts = {};

  newLayouts['simple-layout'] = {
    title: 'Simple layout',
    description: 'A simple stacked one column layout.',
    fluid: false,
    responsive: true,
    sections: {
      'header': {
        'header': {
          'header-first': {
            width: 4
          },
          'header-second': {
            width: 8
          }
        }
      },
      'content': {
        'content': {
          'content': {
            width: 12
          }
        }
      },
      'footer': {
        'footer': {
          width: 12
        }
      }
    }
  };

  callback(null, newLayouts);
};
