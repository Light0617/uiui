'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:totalEfficiencyValue
 * @description
 * # totalEfficiencyValue
 */
angular.module('rainierApp')
    .directive('totalEfficiencyValue', function () {
        return {
            templateUrl: 'views/templates/total-efficiency-value.html',
            restrict: 'E',
            scope: {
                model: '=ngModel'
            }
        };
    });
