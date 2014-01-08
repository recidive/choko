/*
 * Default application settings.
 *
 * Don't change anything here, override it on your own application.
 */

/**
 * Settings object.
 */
var settings = module.exports = {

  // Session secret should be override on your application settings.js file.
  sessionSecret: 'overwrite-and-change-me',

  // Usually overritten on the application settings.js too.
  application: {
    name: 'Default'
  },

  // A list of required core extensions.
  extensions: {
    'field': {},
    'route': {},
    'context': {},
    'layout': {},
    'panel': {},
    'navigation': {},
    'page': {},
    'theme': {},
    'rest': {},
    'form': {},
    'session': {},
    'user': {},
    'management': {}
  }

};
