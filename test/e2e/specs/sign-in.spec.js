var Home = require('../page-objects/home.po');
var Messages = require('../page-objects/partials/messages.po');
var SignInForm = require('../page-objects/sign-in-form.po');

describe( 'Sign in', function() {

  var home = new Home();
  var messages = new Messages();
  var signInForm = new SignInForm();

  beforeEach(function() {
    home.visit();
    home.signInLink.click();
  });

  it( 'navigate to sign in', function() {

    browser.getCurrentUrl().then(function(url) {
      expect(url).toEqual('http://localhost:3000/sign-in');
    });

  });

  it( 'try to sign in without filling user and password', function() {

    signInForm.submitButton.click();

    expect(messages.error.isDisplayed()).toBe(true);

  });

  it( 'try to sign in with invalid user and password', function() {

    signInForm.usernameField.sendKeys('invalid');
    signInForm.passwordField.sendKeys('invalid');
    signInForm.submitButton.click();

    expect(messages.error.isDisplayed()).toBe(true);

  });

});
