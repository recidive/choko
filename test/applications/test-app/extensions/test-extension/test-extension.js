var testExtension = module.exports = {};

/**
 * The role hook().
 */
testExtension.role = function(roles, callback) {
  roles['anonymous'].permissions.push('view-test-type');
  callback();
};
