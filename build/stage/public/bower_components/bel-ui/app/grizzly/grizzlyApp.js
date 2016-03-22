'use strict';

angular.module('grizzly', [
  'restangular',
  'bel-services',
  'config',
  'ui.bootstrap.datetimepicker',
  'ngTagsInput'
]);

/***
 * Config
 */
angular.module('grizzly').config(function($routeProvider, $animateProvider, BEL_UI_PATH) {
  $animateProvider.classNameFilter(/enable-animate/);
  $routeProvider
    .when('/jobs', {
      templateUrl: BEL_UI_PATH + '/app/grizzly/jobs/jobs.html',
      controller: 'jobsController',
      resolve: {
        initialResult: function(grizzlyService) {
          return grizzlyService.getJobs();
        }
      },
      breadcrumbOptions: {
        labelKey: 'jobs-page-title'
      }
    })
    .when('/jobs/:jobId', {
      templateUrl: BEL_UI_PATH + '/app/grizzly/jobs/details/jobDetails.html',
      controller: 'jobDetailController',
      resolve: {
        resolvedJob: function($route, grizzlyService) {
          var jobId = $route.current.params.jobId;
          return grizzlyService.getJob(jobId);
        },
        resolvedChildJobs: function($route, grizzlyService){
          var jobId = $route.current.params.jobId;
          return grizzlyService.getChildJobs(jobId);
        }
      }
    })
});
