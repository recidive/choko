/*
 * The User extension.
 */

var crypto = require('crypto');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var AnonymousStrategy = require('passport-anonymous');
var async = require('async');
var utils = require('prana').utils;

var user = module.exports;

/**
 * The init() hook.
 */
user.init = function(application, callback) {
  // Initialize passport and passportSession middlewares.
  var passportMiddleware = passport.initialize();
  application.routers.rest.use(passportMiddleware);
  application.routers.page.use(passportMiddleware);

  var passportSessionMiddleware = passport.session();
  application.routers.rest.use(passportSessionMiddleware);
  application.routers.page.use(passportSessionMiddleware);

  var User = application.type('user');

  var authCallback = function(username, password, callback) {
    User.login({username: username, password: password}, function (error, user) {
      if (error) {
        return callback(error);
      }
      if (!user) {
        // User and/or password is invalid.
        return callback(null, false);
      }

      // Start from an empty container and merge in user data.
      var cleanedUpUser = {
        roles: []
      };
      utils.extend(cleanedUpUser, user);

      // Remove sensitive data from response.
      delete cleanedUpUser.salt;
      delete cleanedUpUser.password;

      // Add authenticated role.
      cleanedUpUser.roles.push('authenticated');

      return callback(null, cleanedUpUser);
    });
  };

  var cleanUser = function (data, callback) {
    User.load({id: data.id}, function (error, user) {
      if (error) {
        return callback(error);
      }
      if (!user) {
        // User and/or password is invalid.
        return callback(null, false);
      }

      user.roles = user.roles || [];

      delete user.password;
      delete user.salt;

      // Add authenticated role.
      user.roles.push('authenticated');

      callback(null, user);
    });
  };

  // Set up passport local strategy.
  passport.use(new LocalStrategy(authCallback));

  // Set up passport HTTP strategy.
  passport.use(new BasicStrategy(authCallback));

  // Set up passport anonymous strategy.
  passport.use(new AnonymousStrategy());

  passport.serializeUser(function(user, callback) {
    callback(null, user);
  });

  passport.deserializeUser(function(user, callback) {
    cleanUser(user, callback);
  });

  // Add access check method to application object.
  var self = this;
  application.access = function(request, permission, callback) {
    self.access(request, permission, callback);
  };

  // Call init() callback.
  callback();
};

/**
 * The permission() hook.
 */
user.permission = function(permissions, callback) {
  var newPermissions = {};

  newPermissions['sign-in'] = {
    title: 'Sign in',
    description: 'Allow users to sign in on the application.'
  };
  newPermissions['sign-out'] = {
    title: 'Sign out',
    description: 'Allow users to sign out from the application.'
  };
  newPermissions['create-account'] = {
    title: 'Create account',
    description: 'Allow users to create an account on the application.'
  };
  newPermissions['edit-own-account'] = {
    title: 'Edit own account',
    description: 'Allow users to load and edit their own user accounts.'
  };
  newPermissions['manage-users'] = {
    title: 'Manage users',
    description: 'List, create and edit users and manage permissions.'
  };

  callback(null, newPermissions);
};

/**
 * The type() hook.
 */
user.type = function(types, callback) {
  var application = this.application;
  var self = this;
  var newTypes = {};

  newTypes['user'] = {
    title: 'User',
    description: 'Application users.',
    storage: 'database',
    keyProperty: 'id',
    fields: {
      id: {
        title: 'Id',
        type: 'id',
        internal: true
      },
      username: {
        title: 'Username',
        type: 'text',
        required: true,
        unique: true
      },
      email: {
        title: 'Email',
        type: 'email',
        required: true,
        unique: true,
        index: true
      },
      password: {
        title: 'Password',
        type: 'password',
        maxLength: 1024,
        required: true,
        protected: true
      },
      salt: {
        title: 'Salt',
        type: 'text',
        maxLength: 512,
        internal: true,
        protected: true
      },
      roles: {
        title: 'Roles',
        type: 'reference',
        reference: {
          type: 'role',
          multiple: true
        }
      },
      active: {
        title: 'Active',
        type: 'boolean'
      }
    },
    access: {
      'list': 'manage-users',
      'load': function(request, callback) {
        application.access(request, 'edit-own-account', function(error, allow) {
          if (error) {
            return callback(error);
          }
          if (!allow) {
            return callback(null, false);
          }
          // Allow if user is the same as logged in user.
          callback(null, request.params.user && request.params.user == request.user.id);
        });
      },
      'add': 'manage-users',
      'edit': 'manage-users',
      'delete': 'manage-users'
    },
    displays: {
      'list-item': {
        'text': [{
          fieldName: 'username',
          format: 'plain',
          weight: 0
        }]
      },
      'list-group-item': {
        'heading': [{
          fieldName: 'username',
          format: 'title',
          link: '/manage/users/edit/[:id|item]',
          weight: 0
        }],
        'text': [{
          fieldName: 'email',
          format: 'paragraph',
          weight: 0
        }]
      }
    },
    beforeCreate: function(settings, data, callback) {
      self.normalizeUserData(data, callback);
    },
    beforeUpdate: function(settings, data, callback) {
      // Delete salt so password gets hashed properly.
      if (data.password) {
        delete data.salt;
      }
      self.normalizeUserData(data, callback);
    },
    statics: {
      login: function(data, callback) {

        var User = this;
        var query = {
          username: data.username
        };

        this.load(query, function(error, account) {
          if (error) {
            return callback(error);
          }
          if (account) {
            User.hash(data.password, new Buffer(account.salt, 'base64'), function(error, password) {
              if (error) {
                return callback(error);
              }

              if (account.password == password.toString('base64')) {
                // Password matches.
                callback(null, account);
              }
              else {
                // Wrong password.
                callback(null, false);
              }
            });
          }
          else {
            // User not found.
            callback(null, false);
          }
        });
      },
      hash: function(password, salt, callback) {
        // Generate a 512 bits hash with PBKDF2 algorithm.
        crypto.pbkdf2(password, salt, 10000, 512, function(error, key) {
          if (error) {
            return callback(error);
          }

          callback(null, key);
        });
      },
      salt: function() {
        // Generate a 256 bits random binary salt.
        return crypto.randomBytes(256);
      }
    }
  };

  newTypes['role'] = {
    title: 'Role',
    description: 'User roles.',
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
      description: {
        title: 'Description',
        type: 'text'
      },
      permissions: {
        title: 'Permissions',
        type: 'reference',
        reference: {
          type: 'permission',
          multiple: true
        }
      }
    },
    access: {
      'list': 'manage-users',
      'load': 'manage-users',
      'add': 'manage-users',
      'edit': 'manage-users',
      'delete': 'manage-users'
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
    }
  };

  newTypes['permission'] = {
    title: 'Permission',
    description: 'Permission.',
    fields: {
      name: {
        title: 'Name',
        type: 'text'
      },
      title: {
        title: 'Title',
        type: 'text'
      },
      description: {
        title: 'Description',
        type: 'text'
      }
    },
    access: {
      'list': 'manage-users',
      'load': 'manage-users',
      'add': false,
      'edit': false,
      'delete': false
    }
  };

  callback(null, newTypes);
};

/**
 * Normalize user data. Hash password.
 */
user.normalizeUserData = function(data, callback) {
  // If there's salt, don't hash password.
  if ('salt' in data) {
    return callback(null, data);
  }

  var User = this.application.type('user');

  // Generate a salt and hash the password.
  var salt = User.salt();
  User.hash(data.password, salt, function(error, password) {
    if (error) {
      return callback(error);
    }

    // Replace password with hashed one.
    data.password = password.toString('base64');

    // Encode and add salt to payload.
    data.salt = salt.toString('base64');

    // Remove password confirmation.
    delete data['password-confirm'];

    callback(null, data);
  });
};

/**
 * The route() hook.
 */
user.route = function(routes, callback) {
  var newRoutes = {};
  var application = this.application;

  // We create routes to form submits until we figure out what approach to use
  // for handling form submits.
  newRoutes['/create-account-submit'] = {
    access: 'create-account',
    callback: function(request, response, callback) {
      var data = request.body;

      if (!('username' in data)) {
        return callback(null, ['Please provide an username.'], 400);
      }

      var User = application.type('user');

      var query = {
        username: data.username
      };

      User.load(query, function(error, account) {
        if (error) {
          return callback(error);
        }
        if (account) {
          return callback(null, ['This username is not available, please choose another one.'], 409);
        }
        if (data.password != data['password-confirm']) {
          return callback(null, ['Passwords must match.'], 400);
        }

        // Don't allow to pass any user role here for security reasons.
        data.roles = [];

        // Create new user resource and save it.
        User.validateAndSave(data, function(error, newAccount, errors) {
          if (error) {
            return callback(error);
          }

          if (errors && errors.length > 0) {
            // Validation errors.
            return callback(null, errors, 400);
          }

          // Log user in.
          request.login(newAccount, function(error) {
            if (error) {
              return callback(error);
            }
            // Add 'authenticated' role to user to avoid errors.
            newAccount.roles.push('authenticated');
            callback(null, newAccount, 201);
          });

        });

      });

    }
  };

  newRoutes['/settings/edit-account-submit/:id'] = {
    access: 'edit-own-account',
    callback: function(request, response, callback) {
      // @todo: figure out how to prevent form controller from sending the
      // username.
      if (request.user.id != request.params.id) {
        return callback(null, ['Invalid user.'], 400);
      }

      var data = request.body;
      var validateFields = ['username', 'email']

      // Delete unwanted data that may lead to security holes.
      delete data.id;
      delete data.password;
      delete data.salt;
      delete data.roles;

      var User = application.type('user');
      User.load(request.user.id, function(error, account) {
        utils.extend(account, data);
        delete account.password;

        User.validateAndSave(account, validateFields, function(error, account, errors) {
          if (error) {
            return callback(error);
          }

          if (errors && errors.length > 0) {
            // Validation errors.
            return callback(null, errors, 400);
          }

          callback(null, account);
        });
      });
    }
  };

  newRoutes['/settings/change-password-submit'] = {
    access: 'edit-own-account',
    callback: function(request, response, callback) {
      var user = request.user;
      var data = request.body;

      if (!data['password-current']) {
        return callback(null, ['Please provide your current password.'], 400);
      }

      if (!data.password || !data['password-confirm']) {
        return callback(null, ['Please enter a password in both fields.'], 400);
      }

      if (data.password != data['password-confirm']) {
        return callback(null, ['Passwords must match.'], 400);
      }

      var User = application.type('user');
      User.load(user.id, function(error, account) {
        if (error) {
          return callback(error);
        }

        if (account) {
          User.hash(data['password-current'], new Buffer(account.salt, 'base64'), function(error, password) {
            if (error) {
              return callback(error);
            }

            if (account.password == password.toString('base64')) {
              // Password matches, update password.
              account.password = data.password;

              User.validateAndSave(account, function(error, account, errors) {
                if (error) {
                  return callback(error);
                }

                if (errors && errors.length > 0) {
                  // Validation errors.
                  return callback(null, errors, 400);
                }

                callback(null, account);
              });
            }
            else {
              // Wrong password.
              callback(null, ['Invalid current password.'], 400);
            }
          });
        }
        else {
          // User not found.
          callback(null, false);
        }
      });
    }
  };

  newRoutes['/sign-in-submit'] = {
    access: 'sign-in',
    callback: function(request, response, callback) {
      // Check if there are both an username and a password.
      // @todo in the long run we may need a way to validate forms that aren't
      // directly related to a type.
      if (!request.body.username || !request.body.password) {
        return callback(null, ['Please provide an username and a password.'], 400);
      }
      passport.authenticate('local', function(error, account, info) {
        if (error) {
          return callback(error);
        }

        if (!account) {
          return callback(null, ['Invalid username or password.'], 401);
        }

        // Log user in.
        request.login(account, function(error) {
          if (error) {
            return callback(error);
          }
          callback(null, account);
        });

      })(request, response, callback);
    }
  };

  newRoutes['/sign-out'] = {
    access: 'sign-out',
    callback: function(request, response, callback) {
      // Log user out.
      request.logout();
      callback(null, {
        redirect: '/'
      });
    }
  };

  callback(null, newRoutes);
};

/**
 * The role() hook.
 */
user.role = function(routes, callback) {
  var newRoles = {};

  // The 'anonymous' role is a magic role that's set to every user that's not
  // logged in.
  newRoles['anonymous'] = {
    title: 'Anonymous',
    description: 'Anonymous, unauthenticated user.',
    permissions: [
      'create-account',
      'sign-in',
      'view-content'
    ]
  };

  // The 'authenticated' role is a magic role that's set to every authenticated
  // user.
  newRoles['authenticated'] = {
    title: 'Authenticated',
    description: 'Authenticated, signed in user.',
    permissions: [
      'sign-out',
      'edit-own-account',
      'view-content'
    ]
  };

  // The 'administrator' role is a magic default role that's used to grant
  // administration powers to users.
  newRoles['administrator'] = {
    title: 'Administrator',
    description: 'Administrators, or super users. This role has access to everything.'
  };

  callback(null, newRoles);
};

/**
 * The panel() hook.
 */
user.panel = function(panels, callback) {
  var newPanels = {};

  newPanels['sign-in'] = {
    title: 'Sign in',
    bare: true,
    template: '/templates/sign-in.html'
  };
  newPanels['sign-out'] = {
    title: 'Sign out',
    bare: true,
    template: '/templates/sign-out.html'
  };

  callback(null, newPanels);
};

/**
 * The contextConditionType() hook.
 */
user.contextConditionType = function(conditionTypes, callback) {
  var newConditionTypes = {};
  var application = this.application;

  newConditionTypes['anonymous'] = {
    title: 'Anonymous user',
    standalone: false,
    fields: {
      anonymous: {
        title: 'Anonymous',
        type: 'boolean'
      }
    },
    check: function(request, value, callback) {
      callback(!request.user == value);
    }
  };
  newConditionTypes['access'] = {
    title: 'Access',
    standalone: false,
    fields: {
      access: {
        title: 'Permission',
        type: 'reference',
        reference: {
          type: 'permission',
          multiple: 'true'
        }
      }
    },
    check: function(request, permission, callback) {
      application.access(request, permission, function(error, result) {
        callback(result);
      });
    }
  };

  callback(null, newConditionTypes);
};

/**
 * Do access check against current user.
 */
user.access = function(request, permission, callback) {
  // Permission can be a bollean to disable certain operations or allow access
  // to all users.
  if (typeof permission === 'boolean') {
    return callback(null, permission);
  }

  // If user is administrator bypass access check.
  if (request.user && request.user.roles.indexOf('administrator') !== -1) {
    return callback(null, true);
  }

  // Create a mock user for anonymous access.
  var account = request.user || {
    username: 'anonymous',
    roles: ['anonymous']
  };

  // Permission can be a callback.
  if (typeof permission === 'function') {
    return permission.call(this, request, callback);
  }

  var application = this.application;
  async.detect(account.roles, function(roleName, next) {
    application.load('role', roleName, function(error, role) {
      role.permissions = role.permissions || [];
      next(!error && role && role.permissions.indexOf(permission) !== -1);
    });
  }, function(result) {
    // @todo: Cache access check by role combination. Sort user roles, glue them
    // together and use as cache id.

    // async.detect() returns roleName or undefined when nothing was detected,
    // so we need to convert it to boolean in some way.
    callback(null, result !== undefined);
  });
};
