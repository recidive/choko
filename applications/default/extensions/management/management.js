/*
 * The Application Management extension.
 */

var management = module.exports;

/**
 * The permission() hook.
 */
management.permission = function(permissions, callback) {
  var newPermissions = {};

  newPermissions['manage-application'] = {
    title: 'Manage application',
    description: 'Access application managemnt pages.'
  };

  callback(null, newPermissions);
};

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
        title: 'Users',
        url: '/manage/users'
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
    access: 'manage-application',
    content: '<p class="lead">Dashboard content.</p>'
  };

  newPages['manage-users'] = {
    path: '/manage/users',
    title: 'Users',
    access: 'manage-users',
    type: 'list',
    itemType: 'user',
    template: 'templates/user-list.html'
  };

  newPages['manage-users-add-user'] = {
    path: '/manage/users/add-user',
    title: 'Add user',
    access: 'manage-users',
    type: 'form',
    formName: 'type-user'
  };

  newPages['manage-pages'] = {
    path: '/manage/pages',
    title: 'Pages',
    subtitle: 'Application screens',
    description: 'Pages are used to create sections and display application content and UI elements on the application.',
    access: 'manage-pages',
    type: 'list',
    itemType: 'page',
    template: 'templates/list-group.html'
  };

  newPages['manage-panels'] = {
    path: '/manage/panels',
    title: 'Panels',
    subtitle: 'Pieces of information',
    description: 'Panels are chunks of content or UI that can be added to layout regions.',
    access: 'manage-panels',
    type: 'list',
    itemType: 'panel',
    template: 'templates/list-group.html'
  };

  newPages['manage-contexts'] = {
    path: '/manage/contexts',
    title: 'Contexts',
    subtitle: 'Add dynamicity',
    description: 'Contexts are a set of conditions that creates a particular scenario on the application.',
    access: 'manage-contexts',
    type: 'list',
    itemType: 'context',
    template: 'templates/list-group.html'
  };

  newPages['manage-layouts'] = {
    path: '/manage/layouts',
    title: 'Layouts',
    subtitle: 'Page structure',
    description: 'Layouts rule how pages are structured in rows, columns and regions.',
    access: 'manage-layouts',
    type: 'list',
    itemType: 'layout',
    template: 'templates/list-group.html'
  };

  newPages['manage-navigations'] = {
    path: '/manage/navigations',
    title: 'Navigations',
    subtitle: 'Navigation menus and links',
    description: 'Groups of structured links that allow users to change application state.',
    access: 'manage-navigations',
    type: 'list',
    itemType: 'navigation',
    template: 'templates/list-group.html'
  };

  newPages['manage-themes'] = {
    path: '/manage/themes',
    title: 'Themes',
    subtitle: 'Dress your application',
    description: 'Configure application look & feel.',
    access: 'manage-themes',
    type: 'list',
    itemType: 'theme',
    template: 'templates/list-group.html'
  };

  newPages['manage-types'] = {
    path: '/manage/types',
    title: 'Types',
    subtitle: 'Resource types',
    description: 'Types can be everything from application metadata to media objects.',
    access: 'manage-types',
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
    subtitle: 'The building blocks',
    description: 'Extensions are groups of functionality.',
    access: 'manage-extensions',
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
  newContexts['manager'] = {
    title: 'Manager user',
    description: 'Context for users that can access management pages.',
    weight: -1,
    conditions: {
      access: 'manage-application'
    },
    reactions: {
      panel: {
        'navbar-right': [{
          name: 'manage-button',
          weight: 1
        }]
      }
    }
  };

  callback(null, newContexts);
};
