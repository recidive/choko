var assert = require('assert');
var request = require('supertest');

var testingUrl = 'http://localhost:3200';

describe('User extension', function(done) {
  
  it('should not authenticate a user with a wrong username or password', function(done) {
    request(testingUrl)
      .post('/sign-in-submit')
      .send({
        username: 'test',
        password: 'test'
      })
      .expect(401, done);
  });

  it('should authenticate a user', function(done) {
    var application = this.getServer().getApplication('localhost');
    var User = application.type('user');
    
    var data = {username: 'user', password: 'pass', roles: []};
    
    new User(data).save(function(error, newAccount) {
      if (error) {
        assert.fail('error saving');
      }
      request(testingUrl)
        .post('/sign-in-submit')
        .send({
          username: 'user',
          password: 'pass'
        })
        .expect(200, done);
    });
  });
  
  it('should create an account', function(done) {
    request(testingUrl)
      .post('/create-account-submit')
      .send({
        username: 'test123',
        password: 'pass123',
        email: 'user@geste.com',
        'password-confirm': 'pass123'
      })
      .expect(201, done);
  });
  
  it('should create a user and perform login via REST', function(done) {
    request(testingUrl)
      .post('/create-account-submit')
      .send({
        username: 'test123',
        password: 'pass123',
        email: 'user@geste.com',
        'password-confirm': 'pass123'
      })
      .expect(201, function () {
        request(testingUrl)
          .post('/sign-in-submit')
          .send({
            username: 'test123',
            password: 'pass123'
          })
          .expect(200, done);
      });
  });
});
