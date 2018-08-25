'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:hostsIconTile
 * @description
 * # hostsIconTile
 */
angular.module('rainierApp')
    .directive('hostsIconTile', function () {
        return {
            scope: {
                itemCount: '=ngModel'
            },
            templateUrl: 'views/templates/hosts-icon-tile.html',
            restrict: 'E',
            replace: true
        };
    });
