'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:parityGroupBasicListTile
 * @description
 * # parityGroupBasicListTile
 */
angular.module('rainierApp')
    .directive('parityGroupBasicListTile', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/parity-group-basic-list-tile.html',
            restrict: 'E'
        };
    });
