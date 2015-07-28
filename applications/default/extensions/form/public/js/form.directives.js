'use strict';

/**
 * @file Form extension directives.
 */

angular.module('choko')

.directive('ckForm', function() {
  return {
    restrict: 'A',
    controller: 'FormController'
  }
})

.directive('ckElement', function() {
  return {
    restrict: 'A',
    require: ['^ckForm'],
    controller: 'ElementController'
  }
})

.directive('ckFileElement', function() {
  return {
    restrict: 'A',
    require: ['^ckForm'],
    controller: 'FileElementController'
  }
})

.directive('ckFormButton', function() {
  return {
    restrict: 'A',
    require: ['^ckForm'],
    controller: 'FormButtonController'
  }
})

.directive('ckWysiwyg', function() {
  return {
    restrict: 'A',
    require: ['^ckForm'],
    controller: 'WYSIWYGController'
  }
})

.directive('ckReferenceElement', function() {
  return {
    restrict: 'A',
    require: ['^ckForm'],
    controller: 'ReferenceElementController'
  }
})

.directive('ckInlineReferenceElement', function() {
  return {
    restrict: 'A',
    require: ['^ckForm'],
    controller: 'InlineReferenceElementController'
  }
})

.directive('ckInlineReferenceElementItem', function() {
  return {
    restrict: 'A',
    require: ['^ckForm'],
    controller: 'InlineReferenceElementItemController'
  }
});
