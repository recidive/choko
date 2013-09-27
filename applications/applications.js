/*
 * List of enabled sites with their folder names.
 */
var applications = module.exports = {

  // Key is the application hostname. Value is the folder name.
  //
  // For setting domains use the following format:
  //   'example.com' => 'example.com',
  //
  // You can also use wildcards. E.g.:
  //   '*.example.com' => 'example.com',

  // Example application:

  // Simple application to demonstrate Choko features.
  // You can add 'example' to your hosts file to test this on http://example.
  // Comment this out to disable this application completelly.
  //'example': 'example',

  // You can add your applications here:
  //'myapp': 'myapp',

  // Default application. You can change folder name, to change to other
  // applications above without having to change your hosts file.
  // Change to your application dir to make this the default application.
  // Comment this out to disable this application completelly.
  'localhost': 'example'

};
