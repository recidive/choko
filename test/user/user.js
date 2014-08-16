var assert = require('assert');
var request = require('supertest');


describe('User extension', function(done) {
  
  it('should not authenticate a user with a wrong username or password', function(done) {
    request('http://localhost:3200')
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
    
    var user = new User(data).save(function(error, newAccount) {
      if (error) {
        assert.fail('error saving');
      }
      request('http://localhost:3200')
        .post('/sign-in-submit')
        .send({
          username: 'user',
          password: 'pass'
        })
        .expect(200, done);
    });
    
  });
  
  
  it('should ceate an account', function(done) {
    request('http://localhost:3200')
      .post('/create-account-submit')
      .send({
        username: 'test123',
        password: 'pass123',
        email: 'user@geste.com',
        'password-confirm': 'pass123'
      })
      .expect(201, done);
  });
});
