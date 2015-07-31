var prana = require('prana');
var mkdirp = require('mkdirp');

/**
 * Create a directory recursivelly.
 *
 * @param dir Directory to create.
 * @param [mode] Permissions string, default to 0777 & umask.
 * @param callback Function to call.
 */
prana.utils.mkdir = mkdirp;
