'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:totalEfficiencyPercentageValue
 * @description
 * # totalEfficiencyPercentageValue
 */
angular.module('rainierApp')
    .directive('totalEfficiencyPercentageValue', function () {
        return {
            templateUrl: 'views/templates/total-efficiency-percentage-value.html',
            restrict: 'E',
            scope: {
                model: '=ngModel'
            }
        };
    });
