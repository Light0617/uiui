'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:virtualStorageMachineIconTile
 * @description
 * # virtualStorageMachineIconTile
 */
angular.module('rainierApp')
    .directive('virtualStorageMachineIconTile', function () {
        return {
            scope: {
                itemCount: '=ngModel'
            },
            templateUrl: 'views/templates/virtual-storage-machine-icon-tile.html',
            restrict: 'E',
            replace: true
        };
    });
