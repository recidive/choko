var assert = require('assert');
var request = require('supertest');
var userHelper = require('../lib/userHelper');

// Util variables.
var testingUrl = 'http://localhost:3200';

describe('REST extension', function(done) {

  it('should authenticate on REST', function(done) {
    var application = this.getServer().getApplication('localhost');
    var User = application.type('user');

    var userData = userHelper.sample();
    userData['roles'].push('test-role');

    new User(userData).validateAndSave(function(error, newAccount) {
      if (error) {
        return assert.fail('error saving');
      }

      request(testingUrl)
        .get('/rest/testType')
        .auth(userData.username, userData.password)
        .expect(200, done);
    });
  });

});
