'use strict';

angular.module('choko.directives')

.directive('ckElement', function() {
  return {
    restrict: 'A',
    controller: 'ElementController'
  }
});
