'use strict';

angular.module('grizzly').controller('jobDetailController', function ($scope, grizzlyService, resolvedJob, resolvedChildJobs) {

  $scope.path = [resolvedJob];
  $scope.job = resolvedJob;
  $scope.childJobs = resolvedChildJobs.jobs;

  var discoverHierarchy = function(job){
    if (job.parentJobId){
      grizzlyService.getJob(job.parentJobId).then(function(parentJob){
        $scope.path.unshift(parentJob);
        discoverHierarchy(parentJob);
      });
    }
  };

  discoverHierarchy(resolvedJob);
});
