var async = require('async');
var pathToRegexp = require('path-to-regexp');
var contextMiddleware = require('./lib/contextMiddleware');

var context = module.exports;

/**
 * The init() hook.
 */
context.init = function(application, callback) {
  application.routers.page.use(contextMiddleware(application));
  callback();
};

/**
 * The permission() hook.
 */
context.permission = function(permissions, callback) {
  var newPermissions = {};

  newPermissions['manage-contexts'] = {
    title: 'Manage contexts',
    description: 'List, create and edit contexts.'
  };

  callback(null, newPermissions);
};

/**
 * The type() hook.
 */
context.type = function(types, callback) {
  var newTypes = {};
  var application = this.application;

  newTypes['context'] = {
    title: 'Context',
    description: 'Contexts are sets of conditions that result in reactions.',
    fields: {
      name: {
        title: 'Name',
        type: 'text',
        required: true
      },
      title: {
        title: 'Title',
        type: 'text',
        required: true
      },
      conditions: {
        title: 'Conditions',
        type: 'reference',
        reference: {
          type: 'contextCondition',
          multiple: true,
          inline: true,
          object: true,
          titleField: 'type'
        }
      },
      matchAll: {
        title: 'Match all conditions',
        type: 'boolean',
      },
      reactions: {
        title: 'Reactions',
        type: 'reference',
        reference: {
          type: 'contextReaction',
          multiple: true,
          inline: true,
          titleField: 'type'
        }
      }
    },
    displays: {
      'list-group-item': {
        'heading': [{
          fieldName: 'title',
          format: 'title',
          weight: 0
        }],
        'text': [{
          fieldName: 'description',
          format: 'paragraph',
          weight: 5
        }]
      }
    },
    access: {
      'list': 'manage-contexts',
      'load': 'manage-contexts',
      'add': 'manage-contexts',
      'edit': 'manage-contexts',
      'delete': 'manage-contexts'
    },
    methods: {
      // @todo: move this to an extension method.
      execute: function(request, response, callback) {
        // Initialize conditions.
        this.conditions = this.conditions || {};

        var conditionTypeNames = Object.keys(this.conditions);

        // Call callback bellow on the first conditionType that pass, if
        // matchAll is enabled all conditions must pass.
        var method = this.matchAll ? 'filter' : 'detect';
        var context = this;
        async[method](conditionTypeNames, function(conditionTypeName, next) {
          application.pick('contextConditionType', conditionTypeName, function(error, conditionType) {
            conditionType.check(request, context.conditions[conditionTypeName], function(match) {
              next(match);
            });
          });
        },
        function(result) {
          // If none matches or 'matchAll' is enabled and not all conditions
          // matches, return false.
          if (!result || (context.matchAll && result.length != conditionTypeNames.length)) {
            return callback(false);
          }

          context.reactions = context.reactions || {};
          async.each(Object.keys(context.reactions), function(reactionTypeName, next) {
            application.pick('contextReactionType', reactionTypeName, function(error, reactionType) {
              reactionType.react(request, response, context.reactions[reactionTypeName], function(error) {
                next(error);
              });
            });
          },
          function() {
            callback(true);
          });
        });
      }
    }
  };

  newTypes['contextCondition'] = {
    title: 'Context condition',
    formTitle: 'Condition',
    description: 'Conditions that form contexts.',
    standalone: false,
    polymorphic: true,
    access: {
      'list': 'manage-contexts',
      'load': 'manage-contexts',
      'add': 'manage-contexts',
      'edit': 'manage-contexts',
      'delete': 'manage-contexts'
    }
  };

  newTypes['contextReaction'] = {
    title: 'Context reaction',
    formTitle: 'Reaction',
    description: 'Reactions a context can result on.',
    standalone: false,
    polymorphic: true,
    access: {
      'list': 'manage-contexts',
      'load': 'manage-contexts',
      'add': 'manage-contexts',
      'edit': 'manage-contexts',
      'delete': 'manage-contexts'
    }
  };

  callback(null, newTypes);
};

/**
 * The context() hook.
 */
context.context = function(contexts, callback) {
  var newContexts = {};

  newContexts['global'] = {
    title: 'Global',
    description: 'Application wide context.',
    weight: -10,
    conditions: {
      siteWide: true
    },
    reactions: {
      theme: 'default',
      layout: 'one-column',
      panel: {
        'navbar-header': [{
          name: 'brand',
          weight: 0
        }],
        'navbar-left': [{
          name: 'navigation-main',
          weight: 0
        }],
        'footer': [{
          name: 'powered-by',
          weight: 0
        }]
      }
    }
  };

  callback(null, newContexts);
};

/**
 * The contextConditionType() hook.
 */
context.contextConditionType = function(conditionTypes, callback) {
  var newConditionTypes = {};
  var application = this.application;

  newConditionTypes['siteWide'] = {
    title: 'Site wide',
    standalone: false,
    check: function(request, value, callback) {
      callback(true);
    }
  };

  newConditionTypes['path'] = {
    title: 'Path',
    standalone: false,
    fields: {
      operator: {
        title: 'Operator',
        type: 'text'
      },
      value: {
        title: 'Value',
        type: 'text'
      }
    },
    check: function(request, urls, callback) {
      // Use express regex to match URL.
      var regex = pathToRegexp(urls);
      callback(regex.exec(request.url));
    }
  };

  newConditionTypes['and'] = {
    title: 'And',
    standalone: false,
    fields: {
      value: {
        title: 'Conditions',
        type: 'reference',
        reference: {
          type: 'contextCondition',
          multiple: true,
          inline: true
        }
      }
    },
    check: function(request, conditions, callback) {
      var conditionTypeNames = Object.keys(conditions);
      async.filter(conditionNames, function(conditionTypeName, next) {
        application.pick('contextConditionType', conditionTypeName, function(err, conditionType) {
          conditionType.check(request, conditions[conditionTypeName], function(match) {
            next(match);
          });
        });
      }, function(result) {
        // Check if all conditions passed.
        callback(result.length == conditionTypeNames.length);
      });
    }
  };

  newConditionTypes['or'] = {
    title: 'Or',
    standalone: false,
    fields: {
      value: {
        title: 'Conditions',
        type: 'reference',
        reference: {
          type: 'contextCondition',
          multiple: true,
          inline: true
        }
      }
    },
    check: function(request, conditions, callback) {
      async.detect(Object.keys(conditions), function(conditionTypeName, next) {
        application.pick('contextConditionType', conditionTypeName, function(err, conditionType) {
          conditionType.check(request, conditions[conditionTypeName], function(match) {
            next(match);
          });
        });
      }, function(result) {
        callback(result !== undefined);
      });
    }
  };

  callback(null, newConditionTypes);
};

/**
 * The contextReactionType() hook.
 */
context.contextReactionType = function(reactionTypes, callback) {
  var newReactionTypes = {};

  newReactionTypes['addCSS'] = {
    title: 'Add CSS',
    description: 'Add a CSS file.',
    standalone: false,
    fields: {
      styles: {
        title: 'Styles',
        description: 'Styles to add.',
        type: 'text'
      }
    },
    react: function(request, response, styles, callback) {
      response.payload.styles = response.payload.styles ? response.payload.styles.merge(styles) : styles;
      callback();
    }
  };

  newReactionTypes['addJS'] = {
    title: 'Add JavaScript',
    description: 'Add a JavaScript file.',
    standalone: false,
    fields: {
      scripts: {
        title: 'Scripts',
        description: 'Scripts to add.',
        type: 'text'
      }
    },
    react: function(request, response, scripts, callback) {
      response.payload.scripts = response.payload.scripts ? response.payload.scripts.merge(scripts) : scripts;
      callback();
    }
  };

  newReactionTypes['pageTitle'] = {
    title: 'Set page title',
    description: 'Set the title of the page.',
    standalone: false,
    fields: {
      title: {
        title: 'Title',
        description: 'Page title.',
        type: 'text'
      }
    },
    react: function(request, response, title, callback) {
      response.payload.title = title;
      callback();
    }
  };

  callback(null, newReactionTypes);
};
