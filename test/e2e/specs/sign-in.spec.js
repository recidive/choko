var ChokoOrg = require('../page-objects/choko-org.po');
var Messages = require('../page-objects/partials/messages.po');
var SignInForm = require('../page-objects/sign-in-form.po');

describe( 'Sign in', function() {

  var chokoOrg = new ChokoOrg();
  var messages = new Messages();
  var signInForm = new SignInForm();

  beforeEach(function() {
    chokoOrg.visit();
    chokoOrg.signInLink.click();
  });

  it( 'navigate to sign in', function() {

    browser.getCurrentUrl().then(function(url) {
      expect(url).toEqual('http://choko.org/sign-in');
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
