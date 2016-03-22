'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:templatesIconTile
 * @description
 * # templatesIconTile
 */
angular.module('rainierApp')
    .directive('templatesIconTile', function () {
        return {
            scope: {
                itemCount: '=ngModel'
            },
            templateUrl: 'views/templates/templates-icon-tile.html',
            restrict: 'E',
            replace: true
        };
    });
