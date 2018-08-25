'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:jobsAlert
 * @description
 * # jobsAlert
 */
angular.module('rainierApp')
    .directive('jobsAlert', function () {
        return {
            scope: {
                model: '=ngModel'
            },
            templateUrl: 'views/templates/jobs-alert.html',
            controller: function ($scope, orchestratorService) {
                var now = new Date();
                var nowMinusOneDay = new Date();
                nowMinusOneDay.setDate(nowMinusOneDay.getDate() - 1);

                orchestratorService.jobsTimeSlice(nowMinusOneDay.toISOString(), now.toISOString()).then(function (result) {

                    var numOfSuccessJobs = 0;
                    var numOfSuccessWithErrorJobs = 0;
                    var numOfFailedJobs = 0;

                    var ERROR_LEVEL = 'error';
                    var HEALTHY_LEVEL = 'healthy';

                    _.forEach(result.jobs, function (job) {
                        if (job.parentJobId) {
                            return;
                        }
                        if (job.status === 'SUCCESS') {
                            numOfSuccessJobs = numOfSuccessJobs + 1;
                        } else if (job.status === 'SUCCESS_WITH_ERRORS') {
                            numOfSuccessWithErrorJobs = numOfSuccessWithErrorJobs + 1;
                        } else if (job.status === 'FAILED') {
                            numOfFailedJobs = numOfFailedJobs + 1;
                        }
                    });

                    $scope.model.successCount = numOfSuccessJobs;
                    $scope.model.successWithErrorCount = numOfSuccessWithErrorJobs;
                    $scope.model.failedCount = numOfFailedJobs;
                    $scope.model.totalErrors = numOfFailedJobs + numOfSuccessWithErrorJobs;
                    $scope.model.level = ($scope.model.totalErrors > 0) ? ERROR_LEVEL : HEALTHY_LEVEL;
                });
            },
            restrict: 'E',
            replace: true
        };
    });
