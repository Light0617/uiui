'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:parityGroupListItem
 * @description
 * # parityGroupListItem
 */
angular.module('rainierApp')
    .directive('parityGroupListItem', function () {
        return {
            scope: {
                model: '=ngModel',
                data: '=data',
                select: '&'
            },
            templateUrl: 'views/templates/parity-group-list-item.html',
            restrict: 'E',
            link: function postLink(scope) {
                if (!scope.model) {
                    scope.model = { usage: '0%'};
                }
            }
        };
    });
