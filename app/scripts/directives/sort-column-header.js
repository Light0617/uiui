'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:sortColumnHeader
 * @description
 * # sortColumnHeader
 */
angular.module('rainierApp')
    .directive('sortColumnHeader', function () {
        return {
            scope: {
                sortModel: '=ngModel',
                field: '@',
                label: '@'

            },
            templateUrl: 'views/templates/sort-column-header.html',
            restrict: 'E',
            replace: true
        };
    });
