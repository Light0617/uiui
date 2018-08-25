'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:poolsIconTile
 * @description
 * # poolsIconTile
 */
angular.module('rainierApp')
    .directive('poolsIconTile', function () {
        return {
            scope: {
                itemCount: '=ngModel'
            },
            templateUrl: 'views/templates/pools-icon-tile.html',
            restrict: 'E',
            replace: true
        };
    });
