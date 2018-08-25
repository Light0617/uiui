'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:alertListItem
 * @description
 * # alertListItem
 */
angular.module('rainierApp')
    .directive('alertListItem', function () {
        return {
            scope: {
                model: '=ngModel'
            },
            templateUrl: 'views/templates/alert-list-item.html',
            restrict: 'E'
        };
    });
