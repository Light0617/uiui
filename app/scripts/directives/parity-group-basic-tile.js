'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:parityGroupBasicTile
 * @description
 * # parityGroupBasicTile
 */
angular.module('rainierApp')
    .directive('parityGroupBasicTile', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/parity-group-basic-tile.html',
            restrict: 'E'
        };
    });
