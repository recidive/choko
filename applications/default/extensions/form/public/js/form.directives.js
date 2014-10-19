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
})

.directive('ckReferenceElement', function() {
  return {
    restrict: 'A',
    controller: 'ReferenceElementController'
  }
})

.directive('ckInlineReferenceElement', function() {
  return {
    restrict: 'A',
    controller: 'InlineReferenceElementController'
  }
})

.directive('ckInlineReferenceElementItem', function() {
  return {
    restrict: 'A',
    controller: 'InlineReferenceElementItemController'
  }
});
