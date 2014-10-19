'use strict';

angular.module('choko.directives')

.directive('ckElement', function() {
  return {
    restrict: 'A',
    controller: 'ElementController'
  }
})

.directive('ckFileElement', function() {
  return {
    restrict: 'A',
    controller: 'FileElementController'
  }
})

.directive('ckButton', function() {
  return {
    restrict: 'A',
    controller: 'ButtonController'
  }
});
