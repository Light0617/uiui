'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:wizardSvgPage
 * @description
 * # wizardSvgPage
 */

angular.module('rainierApp')
    .directive('wizardSvgPage', function () {

       return {
           scope: {
               data: '=ngModel'
           },
           templateUrl: 'views/templates/wizard-svg-page.html',
           restrict: 'E'
       };
    });
