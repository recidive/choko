/*
 * Create and initialize the Choko server.
 */
var Server = require('./lib/server');

var server = new Server();
server.start(getPort());

// Get port from command line argument "-p" or fallback to 3000.
function getPort() {
  var port = 3000;
  var args = process.argv.slice(2);
  if (args.length && args.shift() === '-p') {
    port = args.shift() || port;
  }
  return port;
}
