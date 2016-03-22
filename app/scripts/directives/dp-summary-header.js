'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:dpSummaryHeader
 * @description
 * # dpSummaryHeader
 */
angular.module('rainierApp')
    .directive('dpSummaryHeader', function () {
        return {
            scope: {
                model: '=ngModel'
            },
            templateUrl: 'views/templates/dp-summary-header.html',
            restrict: 'E'
        };
    });
