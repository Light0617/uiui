'use strict';

angular.module('grizzly').directive('jobDataVis', function ($location, $log, BEL_UI_PATH, queryService) {
  var calculateHealth = function ($scope, jobCountByStatus) {
    var successfulJobs = 0;
    var failedJobs = 0;
    var inProgressJobs = 0;
    var successfulWithErrorsJobs = 0;
    var totalJobs = 0;

    $log.debug('calculateNew with jobCountByStatus: ', jobCountByStatus);

    _.forEach(jobCountByStatus, function (job) {
      if (job.status === 'SUCCESS') {
        successfulJobs = job.count;
      } else if (job.status === 'IN_PROGRESS') {
        inProgressJobs = job.count;
      } else if (job.status === 'FAILED') {
        failedJobs = job.count;
      } else {
        successfulWithErrorsJobs = job.count;
      }
    });

    totalJobs = successfulJobs + failedJobs + inProgressJobs + successfulWithErrorsJobs;
    $log.debug('total jobs: ', totalJobs);

    $scope.stats = {
      totalJobs: totalJobs,
      successfulJobs: {
        count: successfulJobs,
        width: (successfulJobs / totalJobs * 100)
      },
      failedJobs: {
        count: failedJobs,
        width: (failedJobs / totalJobs * 100)

      },
      inProgressJobs: {
        count: inProgressJobs,
        width: (inProgressJobs / totalJobs * 100)
      },
      successfulWithErrorsJobs: {
        count: successfulWithErrorsJobs,
        width: (successfulWithErrorsJobs / totalJobs * 100)
      }
    };

    $scope.lastRefreshTime = moment().format('MMMM Do YYYY, h:mm:ss a');
    $scope.queryService = queryService;

    $log.debug('scope.stats.successfulJobs: ', $scope.stats.successfulJobs);
    $log.debug('scope.stats.failedJobs: ', $scope.stats.failedJobs);
    $log.debug('scope.stats.inProgressJobs: ', $scope.stats.inProgressJobs);
    $log.debug('scope.stats.successfulWithErrorsJobs: ', $scope.stats.successfulWithErrorsJobs);
  };

  var refreshJobs = function (scope, grizzlyService) {
    grizzlyService.getJobsSummary().then(function (result) {
      $log.debug('getJobsSummaryResult: ', result);
      $log.debug('getJobsSummary: ', result.jobCountByStatus);
      calculateHealth(scope, result.jobCountByStatus);
    });
  };

  return {
    restrict: 'E',
    scope: {
      minified: '@'
    },
    controller: function ($scope, grizzlyService) {
      $scope.minMode = ($scope.minified === 'true');

      refreshJobs($scope, grizzlyService);

      $scope.$on('refreshJob', function () {
        refreshJobs($scope, grizzlyService);
      });
    },
    templateUrl: function () {
      return BEL_UI_PATH + '/app/grizzly/jobs/jobDataVis.html';
    }
  };
});
