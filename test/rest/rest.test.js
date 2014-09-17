var assert = require('assert');
var request = require('supertest');
var userHelper = require('../lib/userHelper');

// Util variables.
var testingUrl = 'http://localhost:3200';

describe('REST extension', function(done) {

  it('should authenticate on REST with Basic authentication', function(done) {
    var application = this.getServer().getApplication('localhost');
    var User = application.type('user');

    var userData = userHelper.sample();
    userData['roles'].push('test-role');

    User.validateAndSave(userData, function(error, newAccount) {
      if (error) {
        return assert.fail('error saving');
      }

      request(testingUrl)
        .get('/rest/testType')
        .auth(userData.username, userData.password)
        .expect(200, done);
    });
  });

  it('should not be able to run denied REST requests', function(done) {
    var application = this.getServer().getApplication('localhost');
    var User = application.type('user');

    var userData = userHelper.sample();
    userData['roles'].push('test-role');

    User.validateAndSave(userData, function(error, newAccount) {
      if (error) {
        return assert.fail('error saving');
      }

      request(testingUrl)
        .post('/rest/testType')
        .auth(userData.username, userData.password)
        .send({name: 'test'})
        .expect(403, done);
    });
  });

  it('should be able to run allowed REST requests as anonymous', function(done) {
    request(testingUrl)
      .get('/rest/testType')
      .expect(200, done);
  });

  it('should not be able to run denied REST requests as anonymous', function(done) {
    request(testingUrl)
      .post('/rest/testType')
      .send({name: 'test'})
      .expect(403, done);
  });

});
