var async = require('async');
var page = module.exports;

/**
 * The type() hook.
 */
page.type = function(types, callback) {
  var newTypes = {};

  newTypes['page'] = {
    title: 'Page',
    description: 'An application page.'
  };

  callback(null, newTypes);
};

/**
 * The page() hook.
 */
page.page = function(pages, callback) {
  var newPages = {};

  newPages['home'] = {
    path: '/home',
    title: this.application.settings.application.name,
    access: 'access application'
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
        access: true,
        callback: function(request, response, callback) {
          response.payload.page = pageInfo;
          if (!pageInfo.content && pageInfo.callback) {
            pageInfo.callback(request, response, function(err) {
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
  // Create a context for every application page.
  var Page = this.application.type('page');
  Page.list({}, function(err, pages) {
    if (err) {
      return callback(err);
    }
    var newContexts = {};
    async.each(Object.keys(pages), function(pageName, next) {
      var pageInfo = pages[pageName];
      newContexts['page-' + pageName] = {
        title: pageInfo.title + ' context',
        description: 'Context for the ' + pageInfo.title + ' page.',
        access: true,
        conditions: {
          path: [pageInfo.path]
        },
        reactions: {
          panel: {
            'content': [{
              name: 'page-content',
              weight: 0
            }]
          }
        }
      };
      next();
    }, function(err) {
      if (err) {
        return callback(err);
      }
      callback(null, newContexts);
    });
  });
};
