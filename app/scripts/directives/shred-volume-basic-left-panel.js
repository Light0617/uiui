'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:shredVolumeBasicLeftFilter
 * @description
 * # shredVolumeBasicLeftFilter
 */
angular.module('rainierApp')
    .directive('shredVolumeBasicLeftPanel', function () {

        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/shred-volume-basic-left-panel.html',
            restrict: 'E'
        };
    });
