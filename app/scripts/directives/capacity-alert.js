'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:capacityAlert
 * @description
 * # capacityAlert
 */
angular.module('rainierApp')
    .directive('capacityAlert', function () {
        return {
            scope: {
                alertCount: '=ngModel',
                alertLevel: '='
            },
            templateUrl: 'views/templates/capacity-alert.html',
            restrict: 'E',
            replace: true,
            controller: function ($scope, monitoringService) {
                $scope.launchMonitoring = function (category) {
                    monitoringService.launchMonitoring(category, $scope.alertCount);
                };

                monitoringService.getSummaryStatus(function (result) {
                    var ERROR_LEVEL = 'error';
                    var HEALTHY_LEVEL = 'healthy';

                    $scope.capacityAlertTotals = result.capacityAlertTotals;
                    $scope.alertCount = result.capacityAlertTotals.totalComponentWiseCapacityAlerts;
                    $scope.alertLevel = result.capacityAlertTotals &&
                    (result.capacityAlertTotals.totalComponentWiseCapacityAlerts !== '0' &&
                    result.capacityAlertTotals.totalComponentWiseCapacityAlerts !== 0) ? ERROR_LEVEL : HEALTHY_LEVEL;

                });
            }

        };
    });
