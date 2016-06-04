var SignInForm = function() {

  this.usernameField = element(by.id('element-sign-in-username'));
  this.passwordField = element(by.id('element-sign-in-password'));
  this.submitButton = element(by.id('element-sign-in-submit'));

};

module.exports = SignInForm;
