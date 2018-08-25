'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:parityGroupAdvRightFilter
 * @description
 * # parityGroupAdvRightFilter
 */
angular.module('rainierApp')
    .directive('parityGroupAdvRightFilter', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/parity-group-adv-right-filter.html',
            restrict: 'E'
        };
    });
