var ChokoOrg = function() {

  this.gettingStartedLink = element(by.css('.navbar-nav .ng-scope:nth-child(1) .ng-binding'));
  this.demoLink = element(by.css('.navbar-nav .ng-scope:nth-child(2) .ng-binding'));
  this.contributeLink = element(by.css('.navbar-nav .ng-scope:nth-child(3) .ng-binding'));
  this.aboutLink = element(by.css('.navbar-nav .ng-scope:nth-child(4) .ng-binding'));
  this.blogLink = element(by.css('.navbar-nav .ng-scope:nth-child(5) .ng-binding'));

  this.addBlogPostButton = element(by.css('.ng-binding.btn-primary'));

  this.signInLink = element(by.css('.btn-link'));
  this.createAccountLink = element.all(by.css('.btn-primary')).first();

  this.visit = function() {
    browser.get('');
  };

};

module.exports = ChokoOrg;
