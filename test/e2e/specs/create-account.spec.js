var Home = require('../page-objects/home.po');
var CreateAccountForm = require('../page-objects/create-account-form.po');
var Messages = require('../page-objects/partials/messages.po');

describe( 'Create account', function() {

  var home = new Home();
  var createAccountForm = new CreateAccountForm();
  var messages = new Messages();

  beforeEach(function() {
    home.visit();
    home.createAccountLink.click();
  });

  it( 'navigate to create an account', function() {

    browser.getCurrentUrl().then(function(url) {
      expect(url).toEqual('http://localhost:3000/create-account');
    });

  });

  it( 'try to create an account without filling any field', function() {

    createAccountForm.submitButton.click();

    expect(messages.error.isDisplayed()).toBe(true);

  });

  it( 'password must match', function() {

    createAccountForm.emailField.sendKeys('valid@email.com');
    createAccountForm.usernameField.sendKeys('joe');
    createAccountForm.passwordField.sendKeys('abc');
    createAccountForm.confirmPasswordField.sendKeys('def');

    createAccountForm.submitButton.click();

    expect(messages.error.isDisplayed()).toBe(true);

  });

});
