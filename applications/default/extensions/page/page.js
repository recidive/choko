var async = require('async');
var utils = require('prana').utils;

var page = module.exports;

/**
 * The permission() hook.
 */
page.permission = function(permissions, callback) {
  var newPermissions = {};

  newPermissions['manage-pages'] = {
    title: 'Manage pages',
    description: 'List, create and edit pages.'
  };

  callback(null, newPermissions);
};

/**
 * The type() hook.
 */
page.type = function(types, callback) {
  var newTypes = {};

  newTypes['page'] = {
    title: 'Page',
    description: 'An application page.',
    polymorphic: true,
    fields: {
      name: {
        title: 'Name',
        type: 'text',
        required: 'true',
        weight: -15
      },
      path: {
        title: 'Path',
        type: 'text',
        weight: -10
      },
      title: {
        title: 'Title',
        type: 'text',
        required: 'true',
        weight: -5
      }
    },
    access: {
      'list': 'manage-pages',
      'load': 'manage-pages',
      'add': 'manage-pages',
      'edit': 'manage-pages',
      'delete': 'manage-pages'
    }
  };

  callback(null, newTypes);
};


/**
 * The pageType() hook.
 */
page.pageType = function(pageTypes, callback) {
  var newTypes = {};

  newTypes['list'] = {
    title: 'List page',
    description: 'A item list page.',
    fields: {
      itemType: {
        title: 'Item type',
        type:  'text',
        required: true
      }
    }
  };

  newTypes['item'] = {
    title: 'Item page',
    description: 'A single item page.',
    fields: {
      itemType: {
        title: 'Item type',
        type:  'text',
        required: true
      },
      itemKey: {
        title: 'Item key',
        type:  'text',
        required: true
      }
    }
  };

  newTypes['form'] = {
    title: 'Form page',
    description: 'A form page.',
    fields: {
      formName: {
        title: 'Form',
        type:  'reference',
        reference: {
          type: 'form'
        },
        required: true
      },
      redirect: {
        title: 'Redirect',
        type: 'text',
        description: 'Enter a path to redirect user upon successful form submission.'
      }
    }
  };

  callback(null, newTypes);
}

/**
 * The page() hook.
 */
page.page = function(pages, callback) {
  var newPages = {};

  newPages['home'] = {
    path: '/home',
    title: this.application.settings.application.name,
    content: '<p>Default homepage content.</p>'
  };

  callback(null, newPages);
}

/**
 * The panel() hook.
 */
page.panel = function(panels, callback) {
  var newPanels = {};

  newPanels['page-content'] = {
    title: 'Page content',
    description: 'Main page content.',
    template: 'templates/page-content.html',
    bare: true
  };

  callback(null, newPanels);
};

/**
 * The route() hook.
 */
page.route = function(routes, callback) {
  var self = this;

  // Create a route for every application page.
  var Page = this.application.type('page');
  Page.list({}, function(err, pages) {
    if (err) {
      return callback(err);
    }
    var newRoutes = {};
    async.each(Object.keys(pages), function(pageName, next) {
      var pageInfo = pages[pageName];
      newRoutes[pageInfo.path] = {
        title: pageInfo.title || null,
        // Default page access to "allow".
        access: pageInfo.access || true,
        callback: function(request, response, callback) {
          // Create a new object to avoid altering page structure since it's
          // stored in memory storage which return references to objects.
          var page = {
            params: {}
          };

          // Add page info.
          utils.extend(page, pageInfo);

          // Add the params found on the request if any.
          utils.extend(page.params, request.params);

          if (page.type === 'item' && page.itemType && !page.itemKey) {
            // Try to get key from request params.
            var keyProperty = self.application.type(page.itemType).type.settings.keyProperty;
            if (keyProperty in page.params) {
              page.itemKey = page.params[keyProperty];
            }
          }

          // Add page data to payload.
          response.payload.page = page;

          // Run callback if any.
          if (!page.content && page.callback) {
            page.callback(request, response, function(err) {
              if (err) {
                return callback(err);
              }
              callback(null, response.payload);
            });
          }
          else {
            callback(null, response.payload);
          }
        }
      };
      next();
    }, function(err) {
      if (err) {
        return callback(err);
      }
      callback(null, newRoutes);
    });
  });
};

/**
 * The context() hook.
 */
page.context = function(contexts, callback) {
  // Initialize the content region panels if not inilialized yet.
  contexts['global'].reactions.panel['content'] = contexts['global'].reactions.panel['content'] || [];

  // Add page-content panel to the 'content' region.
  contexts['global'].reactions.panel['content'].push({
    name: 'page-content',
    weight: 0
  });

  callback();
};
