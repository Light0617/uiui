'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:shredVolumeAdvancedLeftFilter
 * @description
 * # shredVolumeAdvancedLeftFilter
 */
angular.module('rainierApp')
    .directive('shredVolumeAdvancedLeftPanel', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/shred-volume-advanced-left-panel.html',
            restrict: 'E'
        };
    });
