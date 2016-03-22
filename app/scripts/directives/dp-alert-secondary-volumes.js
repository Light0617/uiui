'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:dpAlertSecondaryVolumes
 * @description
 * # dpAlertSecondaryVolumes
 */
angular.module('rainierApp')
    .directive('dpAlertSecondaryVolumes', function () {
        return {
            templateUrl: 'views/templates/dp-alert-secondary-volumes.html',
            restrict: 'E',
            replace: true,
            controller: function ($scope, monitoringService) {
                $scope.alertModel.launchDpMonitoring = function () {
                    monitoringService.launchDpMonitoring($scope.alertModel.alertCount);
                };

            }

        };
    });
