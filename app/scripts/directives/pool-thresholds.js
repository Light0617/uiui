'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:poolThresholds
 * @description
 * # poolThresholds
 */
angular.module('rainierApp')
    .directive('poolThresholds', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/pool-thresholds.html',
            restrict: 'E'
        };
    });
