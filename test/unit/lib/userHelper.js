/**
 * @file
 * User related utility functions.
 */
var userHelper = module.exports = {

  createUser: function(application, roles, callback) {
    var User = application.type('user');

    var account = userHelper.sample();
    account.roles = roles;

    User.validateAndSave(account, function(error, user) {
      callback(error, user, account);
    });
  },

  // Generate sample user data used in tests.
  sample: function (confirmation) {
    var user = {
      username: 'user',
      password: 'password',
      roles: [],
      email: 'email@email.com'
    };

    if (confirmation) {
      user['password-confirm'] = 'password';
    }

    return user;
  },

  // Generate credentials used in tests.
  credentials: function () {
    return {
      username: 'user',
      password: 'password'
    };
  }
};
