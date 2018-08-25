'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:parityGroupAddTiles
 * @description
 * # parityGroupAddTiles
 */
angular.module('rainierApp')
    .directive('parityGroupAdvTiles', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/parity-group-adv-tiles.html',
            restrict: 'E'
        };
    });
