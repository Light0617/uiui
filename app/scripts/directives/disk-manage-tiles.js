'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:diskManageTiles
 * @description
 * # diskManageTiles
 */
angular.module('rainierApp')
    .directive('diskManageTiles', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/disk-manage-tiles.html',
            restrict: 'E'
        };
    });
