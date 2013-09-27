/*
 * Create and initialize the Choko server.
 */
var Server = require('./lib/server');

var server = new Server();
server.start(3000);
