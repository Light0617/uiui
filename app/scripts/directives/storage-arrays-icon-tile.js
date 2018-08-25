'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:storageArraysIconTile
 * @description
 * # storageArraysIconTile
 */
angular.module('rainierApp')
    .directive('storageArraysIconTile', function () {
        return {
            scope: {
                itemCount: '=ngModel'
            },
            templateUrl: 'views/templates/storage-arrays-icon-tile.html',
            restrict: 'E',
            replace: true
        };
    });
