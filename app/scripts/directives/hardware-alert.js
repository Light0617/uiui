'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:hardwareAlert
 * @description
 * # hardwareAlert
 */
angular.module('rainierApp')
    .directive('hardwareAlert', function () {
        return {
            scope: {
                alertCount: '=ngModel',
                alertLevel: '='
            },
            templateUrl: 'views/templates/hardware-alert.html',
            controller: function ($scope, monitoringService) {
                $scope.launchMonitoring = function (category) {
                    monitoringService.launchMonitoring(category, $scope.alertCount);
                };
                monitoringService.getSummaryStatus(function (result) {
                    var ERROR_LEVEL = 'error';
                    var HEALTHY_LEVEL = 'healthy';

                    $scope.hardwareAlertTotals = result.hardwareAlertTotals;
                    $scope.alertCount = result.hardwareAlertTotals.totalComponentWiseHardwareAlerts;
                    $scope.alertLevel = result.hardwareAlertTotals &&
                    (result.hardwareAlertTotals.totalComponentWiseHardwareAlerts !== '0' &&
                    result.hardwareAlertTotals.totalComponentWiseHardwareAlerts !== 0) ? ERROR_LEVEL : HEALTHY_LEVEL;
                });
            },
            restrict: 'E',
            replace: true
        };
    });
