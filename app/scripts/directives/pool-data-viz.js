'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:v
 * @description
 * # poolDataViz
 */
angular.module('rainierApp')
    .directive('poolDataViz', function () {
        return {
            scope: {
                model: '=ngModel',
                data: '=',
                select: '&'
            },
            templateUrl: 'views/templates/pool-data-viz.html',
            restrict: 'E'
        };
    });
