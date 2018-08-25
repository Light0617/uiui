'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:parityGroupTile
 * @description
 * # parityGroupTile
 */
angular.module('rainierApp')
    .directive('parityGroupTile', function () {
        return {
            scope: {
                model: '=ngModel',
                data: '=data',
                select: '&'
            },
            templateUrl: 'views/templates/parity-group-tile.html',
            restrict: 'E',
            link: function postLink(scope) {
                if (!scope.model) {
                    scope.model = { usage: '0%'};
                }
            }
        };
    });
