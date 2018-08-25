'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:hostSummaryHeader
 * @description
 * # hostSummaryHeader
 */
angular.module('rainierApp')
    .directive('hostSummaryHeader', function () {
        return {
            scope: {
                model: '=ngModel'
            },
            templateUrl: 'views/templates/host-summary-header.html',
            restrict: 'E'
        };
    });
