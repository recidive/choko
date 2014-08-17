var assert = require('assert');
var request = require('supertest');

// Util variables.
var testingUrl = 'http://localhost:3200';

var userHelper = {
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
  credentials: function () {
    return {
      username: 'user',
      password: 'password'
    };
  }
};

describe('User extension', function(done) {

  it('should not authenticate a user with a wrong username or password', function(done) {
    request(testingUrl)
      .post('/sign-in-submit')
      .send(userHelper.sample())
      .expect(401, done);
  });

  it('should authenticate a user', function(done) {
    var application = this.getServer().getApplication('localhost');
    var User = application.type('user');

    new User(userHelper.sample()).validateAndSave(function(error, newAccount) {
      if (error) {
        return assert.fail('error saving');
      }

      request(testingUrl)
        .post('/sign-in-submit')
        .send(userHelper.credentials())
        .expect(200, done);
    });
  });

  it('should not create an account with a less then (?) char passwords', function(done) {
    var application = this.getServer().getApplication('localhost');
    var User = application.type('user');

    var user = userHelper.sample();
    user.password = 'small';

    new User(user).validateAndSave(function(error, newAccount, errors) {
      if (error) {
        return assert.fail('error saving');
      }

      if (errors && errors.length && errors[0] == 'Password must have at least 6 characters.') {
        return done();
      }

      assert.fail('Saved user with invalid password');
    });
  });

  it('should create an account', function(done) {
    request(testingUrl)
      .post('/create-account-submit')
      .send(userHelper.sample(true))
      .expect(201, done);
  });

  it('should create a user and perform login via REST', function(done) {
    request(testingUrl)
      .post('/create-account-submit')
      .send(userHelper.sample(true))
      .expect(201, function () {
        request(testingUrl)
          .post('/sign-in-submit')
          .send(userHelper.credentials())
          .expect(200, done);
      });
  });
});
