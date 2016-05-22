var ChokoOrg = require('../page-objects/choko-org.po');

describe( 'Choko.org', function() {

  var chokoOrg = new ChokoOrg();

  beforeEach(function() {
    chokoOrg.visit();
  });

  it( 'navigate to Getting started', function() {

    chokoOrg.gettingStartedLink.click();

    browser.getCurrentUrl().then(function(url) {
      expect(url).toEqual('http://choko.org/getting-started');
    });

  });

  it( 'navigate to Demo', function() {

    chokoOrg.demoLink.click();

    browser.getCurrentUrl().then(function(url) {
      expect(url).toEqual('http://demo.choko.org/');
    });

  });

  it( 'navigate to Contribute', function() {

    chokoOrg.contributeLink.click();

    browser.getCurrentUrl().then(function(url) {
      expect(url).toEqual('http://choko.org/contribute');
    });

  });

  it( 'navigate to About', function() {

    chokoOrg.aboutLink.click();

    browser.getCurrentUrl().then(function(url) {
      expect(url).toEqual('http://choko.org/about');
    });

  });

  it( 'navigate to Blog', function() {

    chokoOrg.blogLink.click();

    browser.getCurrentUrl().then(function(url) {
      expect(url).toEqual('http://choko.org/blog');
    });

  });

});
