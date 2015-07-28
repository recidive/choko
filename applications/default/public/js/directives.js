'use strict';

/**
 * @file Choko core directives.
 */

// Append directives to main choko module.
angular.module('choko')

  // Directive to return the application's version.
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])

  // Directive to replace any tag with overridable templates from the server.
  .directive('ckReplace', ['$http', '$compile', function($http, $compile) {
    return {
      restrict: 'EA',

      // As this directive will replace the existing markup, it's better that
      // we run it previously to most other directives, to avoid dumb processing.
      priority: 100,
      compile: function(element, attrs) {
         return function(scope, element, attrs) {

          // Request the template content.
          var loadTemplate = $http({
            method: 'GET',
            // If the directive is an element, "src" should be available.
            url: attrs.ckReplace || attrs.src,
            cache: true
          });

          // When ready, compile the retrieved template.
          loadTemplate.then(function(result) {

            // Compile the returned template.
            var compiled = $compile(result.data)(scope);

            // Replace old element with compiled one.
            element.replaceWith(angular.element(compiled));

          });
        };
      }
    };
  }])

  // A helper service to handle re-compiling of directives.
  .factory('ckReplaceAndRecompile', ['$compile', function ($compile) {

    // Creates a new element from the given, copying attributes but removing
    // the old directive to avoid running it again. Recompiles the new
    // element and replaces the old with it.
    return function (element, directiveToRemove, scope, newTag) {

      // Handle multiple removals using a array of removing directives.
      var directives = directiveToRemove.length ? directiveToRemove : [];
      var tagName = element.prop('localName');
      var replacement;

      // Replace the directive, be it a tag name or attribute.
      directives.forEach(function (directive) {
        if (tagName == directive) {
          replacement = angular.element(document.createElement(newTag || 'div'));
          angular.element.each(element[0].attributes, function (i, attr) {
            replacement.attr(attr.name, attr.value);
          });
          element.replaceWith(replacement);
          element = replacement;
        }
        else {
          element.removeAttr(directive);
        }
      });

      // Recompile the element.
      $compile(element)(scope || {});
    }
  }])

  // Directive to replace form elements with overridable templates from
  // the server.
  .directive('ckReplaceElement', ['ckReplaceAndRecompile', function(ckReplaceAndRecompile) {
    return {
      restrict: 'EA',
      // This directive will insert other directives dynamically. We set
      // priority=999 (high number) to make it run first, but nor before core
      // Angular directives, as we need their data. (ng-repeat runs at 1000
      // priority).
      priority: 999,
      terminal: true,
      compile: function (tElement, attrs) {
        return function(scope, element, attrs) {

          // Allow for custom templates but fallback to default one based
          // on element type.
          scope.element.template = scope.element.template || '/templates/' + scope.element.type + '.html';
          scope.element.isSubform = attrs.subForm ? true : false;

          // Append the ck-replace directive.
          element.attr('ck-replace', scope.element.template);

          ckReplaceAndRecompile(element, ['ck-replace-element', 'ng-repeat'], scope);
        }
      }
    };
  }])

  // Handles button or button groups for navigation bars.
  // @todo This directive is specifically used by the navigation extension.
  //       Therefore it should be moved to this extension's directory.
  .directive('ckButton', ['ckReplaceAndRecompile', function(ckReplaceAndRecompile) {
    return {
      restrict: 'EA',
      scope: true,
      // This directive will insert other directives dynamically. We set
      // priority=999 (high number) to make it run first, but nor before core
      // Angular directives, as we need their data. (ng-repeat runs at 1000
      // priority).
      priority: 999,
      terminal: true,
      compile: function(element, attrs) {
        return function(scope, element, attrs) {
          // Add bootstrap button class.
          scope.item.classes = scope.item.classes || [];

          if (scope.item.classes.indexOf('btn-default') !== -1) {
            scope.item.classes.push('btn-default');
          }

          // Allow for custom templates but fallback to default
          if (!scope.item.template) {
            scope.item.template = scope.item.items ? '/templates/btn-group-dropdown.html' : '/templates/btn-group-button.html';
          }

          // Append the replacement directive.
          element.attr('ck-replace', scope.item.template);

          ckReplaceAndRecompile(element, ['ck-button', 'ng-repeat'], scope);
        };
      }
    };
  }]);
