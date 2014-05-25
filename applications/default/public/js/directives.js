/**
 * @file Choko directives.
 */

'use strict';

// Append directives to main choko module.
angular.module('choko')
  
  /**
   * Directive to return the application's version.
   * @param  {string} version
   */
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])

  /**
   * Replaces any tag with overridable templates from the server.
   * @param  {object} $http
   * @param  {object} $compile
   */
  .directive('ckReplace', function($http, $compile, $injector) {
    return {
      restrict: 'E',
      scope: true,
      compile: function(element, attrs) {
        return function(scope, element, attrs) {

          // Allow for custom templates but fallback to default one based
          // on element type.
          scope.element.template = scope.element.template || 'templates/' + scope.element.type + '.html';
          
          // Retrive and compile element template.
          compileAndReplace(scope, element, scope.element.template);
        };
      }
    };
  })

  /**
   * [description]
   * @param  {[type]} $http
   * @param  {[type]} $compile
   * @return {[type]}
   */
  .directive('ckButton', function($http, $compile, $injector) {
    return {
      restrict: 'E',
      scope: true,
      compile: function(element, attrs) {
        return function(scope, element, attrs) {

          // Add bootstrap button class.
          scope.item.classes = scope.item.classes || ['btn-default'];

          // @TODO: we should probably allow for custom templates, as we do in
          // cdReplace directive above.
          var template = scope.item.items ? '/templates/btn-group-dropdown.html' : '/templates/btn-group-button.html';
          
          // Retrive and compile element template.
          compileAndReplace(scope, element, template);
        };
      }
    };
  });

/**
 * Helper function to retrive a template for a element, compile it and
 * replace the element with it's newly compiled one.
 * @param  {object} scope
 * @param  {object} element
 * @param  {string} templateUrl
 */
function compileAndReplace(scope, element, templateUrl) {

  var $injector = element.injector();
  var $http     = $injector.get('$http');
  var $compile  = $injector.get('$compile');

  // Request the template content.
  var loadTemplate = $http({
    method: 'GET',
    url: templateUrl,
    cache: true
  });

  // When ready, compile the retrieved template.
  loadTemplate.then(function(result) {

    // Compile the returned template.
    var compiled = $compile(result.data)(scope);

    // Replace old element with compiled one.
    element.replaceWith(angular.element(compiled));

  });
}