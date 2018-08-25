'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:attachVolumeList
 * @description
 * # attachVolumeList
 */
angular.module('rainierApp')
    .directive('attachVolumeList', function () {
        return {
            scope: {
                model: '=ngModel',
                data: '=data',
                select: '&'
            },
            templateUrl: 'views/templates/attach-volume-list.html',
            restrict: 'E'
        };
    });
