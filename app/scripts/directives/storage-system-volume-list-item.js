'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:storageSystemVolumeListItem
 * @description
 * # storageSystemVolumeListItem
 */
angular.module('rainierApp')
    .directive('storageSystemVolumeListItem', function () {
        return {
            scope: {
                model: '=ngModel',
                data: '=data'
            },
            templateUrl: 'views/templates/storage-system-volume-list-item.html',
            restrict: 'E',
            controller: function ($scope, monitoringService) {
                $scope.launchDpMonitoringFromVolumeTile = function () {
                    monitoringService.launchDpMonitoringFromVolumeTile();
                };
            }
        };
    });
