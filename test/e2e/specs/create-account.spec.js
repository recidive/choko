var ChokoOrg = require('../page-objects/choko-org.po');
var CreateAccountForm = require('../page-objects/create-account-form.po');
var Messages = require('../page-objects/partials/messages.po');

describe( 'Create account', function() {

  var chokoOrg = new ChokoOrg();
  var createAccountForm = new CreateAccountForm();
  var messages = new Messages();

  beforeEach(function() {
    chokoOrg.visit();
    chokoOrg.createAccountLink.click();
  });

  it( 'navigate to create an account', function() {

    browser.getCurrentUrl().then(function(url) {
      expect(url).toEqual('http://choko.org/create-account');
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
