/*
 * The Application Management extension.
 */

var management = module.exports;

/**
 * The navigation() hook.
 */
management.navigation = function(navigations, callback) {
  var newNavigations = {};

  newNavigations['manage'] = {
    title: 'Manage',
    description: 'Site management navigation.',
    classes: ['nav-pills'],
    stacked: true,
    items: [
      {
        title: 'Overview',
        url: '/manage'
      },
      {
        title: 'Pages',
        url: '/manage/pages'
      },
      {
        title: 'Panels',
        url: '/manage/panels'
      },
      {
        title: 'Contexts',
        url: '/manage/contexts'
      },
      {
        title: 'Layouts',
        url: '/manage/layouts'
      },
      {
        title: 'Navigations',
        url: '/manage/navigations'
      },
      {
        title: 'Types',
        url: '/manage/types'
      },
      {
        title: 'Extensions',
        url: '/manage/extensions'
      }
    ]
  };

  // Add main navigation item for the management pages.
  navigations['main'].items.push({
    title: 'Manage',
    url: '/manage'
  });

  callback(null, newNavigations);
};

/**
 * The page() hook.
 */
management.page = function(pages, callback) {
  var self= this;
  var newPages = {};

  newPages['manage'] = {
    path: '/manage',
    title: 'Dashboard',
    access: 'manage application',
    content: '<p class="lead">Dashboard content.</p>'
  };

  newPages['manage-pages'] = {
    path: '/manage/pages',
    title: 'Pages',
    access: 'manage panels',
    type: 'list',
    itemType: 'panel',
    template: 'templates/list-group.html'
  };

  newPages['manage-panels'] = {
    path: '/manage/panels',
    title: 'Panels',
    subtitle: 'Chunks of information',
    description: 'Panels are chunks of content or UI that can be added to layout regions.',
    access: 'manage panels',
    type: 'list',
    itemType: 'panel',
    template: 'templates/list-group.html'
  };

  newPages['manage-contexts'] = {
    path: '/manage/contexts',
    title: 'Contexts',
    access: 'manage contexts',
    type: 'list',
    itemType: 'context',
    template: 'templates/list-group.html'
  };

  newPages['manage-layouts'] = {
    path: '/manage/layouts',
    title: 'Layouts',
    access: 'manage layouts',
    type: 'list',
    itemType: 'layout',
    template: 'templates/list-group.html'
  };

  newPages['manage-navigations'] = {
    path: '/manage/navigations',
    title: 'Navigations',
    access: 'manage navigations',
    type: 'list',
    itemType: 'navigation',
    template: 'templates/list-group.html'
  };

  newPages['manage-types'] = {
    path: '/manage/types',
    title: 'Types',
    access: 'manage types',
    callback: function(request, response, callback) {
      var types = self.application.types;
      var result = {};
      for (var typeName in types) {
        var type = types[typeName];
        result[typeName] = {
          title: type.type.settings.title,
          description: type.type.settings.description
        };
      }
      response.payload.page.items = result;
      callback();
    },
    template: 'templates/list-group.html'
  };

  newPages['manage-extensions'] = {
    path: '/manage/extensions',
    title: 'Extensions',
    access: 'manage extensions',
    callback: function(request, response, callback) {
      var extensions = self.application.extensions;
      var result = {};
      for (var extensionName in extensions) {
        var extension = extensions[extensionName];
        result[extensionName] = {
          title: extension.settings.title,
          description: extension.settings.description
        };
      }
      response.payload.page.items = result;
      callback();
    },
    template: 'templates/list-group.html'
  };

  callback(null, newPages);
};

/**
 * The context() hook.
 */
management.context = function(contexts, callback) {
  var newContexts = {};

  newContexts['manage'] = {
    title: 'Management pages',
    description: 'Management pages context.',
    access: 'access application',
    weight: -1,
    conditions: {
      path: ['/manage', '/manage/*']
    },
    reactions: {
      theme: 'default',
      layout: 'two-columns-3-9',
      panel: {
        'sidebar': [{
          name: 'navigation-manage',
          weight: 0
        }]
      }
    }
  };

  callback(null, newContexts);
};
