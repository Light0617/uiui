'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:hostListItem
 * @description
 * # hostListItem
 */
angular.module('rainierApp')
    .directive('hostListItem', function () {
        return {
            scope: {
                model: '=ngModel',
                data: '=data',
                select: '&'
            },
            templateUrl: 'views/templates/host-list-item.html',
            restrict: 'E',
            link: function postLink(scope) {
                if (!scope.model) {
                    scope.model = { usage: '0%'};
                }
            }
        };
    });
