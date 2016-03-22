'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:tileViewAdd
 * @description
 * # tileViewAdd
 */
angular.module('rainierApp')
    .directive('tileViewAdd', function () {
        return {
            templateUrl: 'views/templates/tile-view-add.html',
            restrict: 'E'
        };
    });
