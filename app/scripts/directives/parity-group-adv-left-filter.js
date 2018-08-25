'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:parityGroupAdvLeftFilter
 * @description
 * # parityGroupAdvLeftFilter
 */
angular.module('rainierApp')
    .directive('parityGroupAdvLeftFilter', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/parity-group-adv-left-filter.html',
            restrict: 'E'
        };
    });
