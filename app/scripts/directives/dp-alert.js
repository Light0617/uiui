'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:dataProtectionAlert
 * @description
 * # dataProtectionAlert
 */
angular.module('rainierApp')
    .directive('dpAlert', function () {
        return {
            scope: false,
            templateUrl: 'views/templates/dp-alert.html',
            restrict: 'E',
            replace: true,
            controller: function ($scope, monitoringService) {
                $scope.launchDpMonitoring = function () {
                    monitoringService.launchDpMonitoring($scope.alertCount);
                };

                monitoringService.getDpAlerts(function (result) {
                    var HEALTHY_LEVEL = 'healthy';
                    var UNHEALTHY_LEVEL = 'error';

                    $scope.alertCount = result.total;
                    $scope.alertLevel = result.total !== '0' &&
                    result.total !== 0 ? UNHEALTHY_LEVEL : HEALTHY_LEVEL;
                });
            }

        };
    });
