var SpecReporter = require('jasmine-spec-reporter');

exports.config = {
  // Uses browser's own webdriver.
  directConnect: true,

  // Spec patterns are relative to the location of this config.
  specs: [
    'specs/*.spec.js'
  ],


  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {'args': ['--disable-extensions']},

    // Used for running all test files in paralel.
    // Comment it to run all tests in one browser.
    shardTestFiles: true,
    maxInstances: 4,
  },

  // Define things that will happen before start testing.
  onPrepare: function() {
    // Add better test report on console.
    jasmine.getEnv().addReporter(new SpecReporter({
      displayFailuresSummary: true,
      displayFailedSpec: true,
      displaySuiteNumber: true,
      displaySpecDuration: true
    }));

    browser.driver.manage().window().maximize();
  },


  // A base URL for your application under test. Calls to protractor.get()
  // with relative paths will be prepended with this.
  baseUrl: 'http://localhost:3000/',

  jasmineNodeOpts: {
    onComplete: null,
    isVerbose: false,
    showColors: true,
    includeStackTrace: true,
    defaultTimeoutInterval: 999999
  }
};
