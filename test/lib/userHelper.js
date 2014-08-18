/**
 * @file 
 * User related utility functions.
 */
module.exports = {

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
