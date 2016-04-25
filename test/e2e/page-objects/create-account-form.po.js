var CreateAccountForm = function() {

  this.emailField = element(by.id('element-create-account-email'));
  this.usernameField = element(by.id('element-create-account-username'));
  this.passwordField = element(by.id('element-create-account-password'));
  this.confirmPasswordField = element(by.id('element-create-account-password-confirm'));
  this.submitButton = element(by.id('element-create-account-submit'));

};

module.exports = CreateAccountForm;
