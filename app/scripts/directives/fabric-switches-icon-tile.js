'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:fabricSwitchesIconTile
 * @description
 * # fabricSwitchesIconTile
 */
angular.module('rainierApp')
    .directive('fabricSwitchesIconTile', function () {
        return {
            scope: {
                itemCount: '=ngModel'
            },
            templateUrl: 'views/templates/fabric-switches-icon-tile.html',
            restrict: 'E',
            replace: true
        };
    });
