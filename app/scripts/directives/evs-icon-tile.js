'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:evsIconTile
 * @description
 * # evsIconTile
 */
angular.module('rainierApp')
    .directive('evsIconTile', function () {
        return {
            scope: {
                itemCount: '=ngModel'
            },
            templateUrl: 'views/templates/evs-icon-tile.html',
            restrict: 'E',
            replace: true
        };
    });
