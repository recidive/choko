var Home = function() {

  this.signInLink = element(by.css('.btn-link'));
  this.createAccountLink = element.all(by.css('.btn-primary')).first();

  this.visit = function() {
    browser.get('');
  };

};

module.exports = Home;
