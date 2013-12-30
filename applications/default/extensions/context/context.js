var async = require('async');
var expressUtils = require('express/lib/utils');
var contextMiddleware = require('./lib/contextMiddleware');

var context = module.exports;

/**
 * The init() hook.
 */
context.init = function(application, callback) {
  // Load all pages and routes.
  var Context = this.application.type('context');
  var Condition = this.application.type('condition');
  var Reaction = this.application.type('reaction');

  // Load all conditions and reactions in parallel.
  async.parallel([
    function(next) {
      Condition.list({}, next);
    },
    function(next) {
      Reaction.list({}, next);
    }
  ],
  function(err, results) {
    // Load all contexts.
    Context.list({}, function(err, contexts) {
      application.application.use(contextMiddleware(application));
      callback();
    });
  });
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

  newTypes['context'] = {
    title: 'Context',
    description: 'Contexts are set of conditions that results in reactions.',
    fields: {
      conditions: {
        title: 'Conditions',
        type: 'condition',
        settings: {
          optionsCallback: function(callback) {
            callback();
          }
        }
      },
      reactions: {
        title: 'Reactions',
        type: 'reaction'
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
      execute: function(request, response, callback) {
        var Condition = this.application.type('condition');
        // Call callback on the first condition that pass.
        // @todo: Eventually we may want to add an operator and also allow OR
        // and ANDs.
        this.conditions = this.conditions || {};
        var self = this;
        async.detect(Object.keys(this.conditions), function(conditionName, next) {
          Condition.load(conditionName, function(err, condition) {
            condition.check(request, self.conditions[conditionName], function(match) {
              next(match);
            });
          });
        }, function(result) {
          if (!result) {
            return callback(false);
          }
          var Reaction = self.application.type('reaction');
          self.reactions = self.reactions || {};
          async.each(Object.keys(self.reactions), function(reactionName, next) {
            Reaction.load(reactionName, function(err, reaction) {
              reaction.react(request, response, self.reactions[reactionName], function(err) {
                next(err);
              });
            });
          }, function() {
            callback(true);
          });
        });
      }
    }
  };

  newTypes['condition'] = {
    title: 'Condition',
    description: 'Conditions that form contexts.'
  };

  newTypes['reaction'] = {
    title: 'Reaction',
    description: 'Reactions a context can result on.'
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
    access: 'access application',
    weight: -10,
    conditions: {
      siteWide: true
    },
    reactions: {
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
 * The condition() hook.
 */
context.condition = function(conditions, callback) {
  var newConditions = {};

  newConditions['siteWide'] = {
    title: 'Site wide',
    arguments: {
      operator: {
        title: 'Operator',
        type: 'String'
      },
      value: {
        title: 'Value',
        type: 'String'
      }
    },
    check: function(request, value, callback) {
      callback(value);
    }
  };

  newConditions['path'] = {
    title: 'Path',
    arguments: {
      operator: {
        title: 'Operator',
        type: 'String'
      },
      value: {
        title: 'Value',
        type: 'String'
      }
    },
    check: function(request, urls, callback) {
      // Use express regex to match URL.
      var regex = expressUtils.pathRegexp(urls);
      async.detect(urls, function(url, next) {
        next(regex.exec(request.url));
      }, function(result) {
        callback(result !== undefined);
      });
    }
  };

  callback(null, newConditions);
};
