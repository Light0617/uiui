'use strict';

angular.module('grizzly').factory('grizzlyService', function ($log, Restangular, queryService) {
  var jobsResource = 'jobs';

  var getJob = function (jobId) {
      return Restangular
        .one(jobsResource, jobId)
        .get();
  };

  return {
    getJob: function (jobId) {
      return getJob(jobId);
    },
    getJobs: function (token) {

      $log.debug('getting jobs with token ', token);
      if (_.isUndefined(token)) {
        queryService.queryMap = {};
        queryService.setQueryMapEntry('_missing_', 'parentJobId', false);
        queryService.setQueryMapEntry('isSystem', 'false', false);
        queryService.setQueryMapEntry('startDate', null, false);
        queryService.setQueryMapEntry('endDate', null, false);
        queryService.setSort('startDate', true, false);
      }

      var queryParams = queryService.getQueryParameters();

      if (!_.isUndefined(token)) {
        queryParams.nextToken = token;
      }

      return Restangular
        .one(jobsResource)
        .get(queryParams)
        .then(function (result) {
          return result;
        });
    },
    getChildJobs: function (parentId) {
      $log.debug('getting child jobs');
      queryService.queryMap = {};
      queryService.setQueryMapEntry('parentJobId', parentId, false);
      queryService.setQueryMapEntry('startDate', null, false);
      queryService.setQueryMapEntry('endDate', null, false);
      queryService.setSort('startDate', true, false);

      return Restangular
        .one(jobsResource)
        .get(queryService.getQueryParameters())
        .then(function (result) {
          return result;
        });
    },
    getSortedAndFilteredJobs: function () {
      $log.debug('getting sorted and filtered jobs');
      return Restangular
        .one(jobsResource)
        .get(queryService.getQueryParameters())
        .then(function (result) {
          return result;
        });
    },
    getJobsSummary: function () {
      var queryParams = queryService.getQueryParameters();

      $log.debug('getting job summary');
      return Restangular
        .one(jobsResource)
        .one('summary')
        .get(queryParams)
        .then(function (result) {
          return result;
        });
    },
    getJobsTags: function (queryText) {
      $log.debug('getting jobs tags');
      return Restangular
        .one(jobsResource)
        .one('tags')
        .get({
          q:['tag:' + queryText]
        })
        .then(function (result) {
          $log.debug('result: ', result.tags);
          return result.tags;
        });
    },
    textSearchQueryFunction: function(queryObject) {
      $log.debug('calling title specific query string function');
      if (queryObject.queryText) {
        return '(title.text=' + queryObject.queryText + ' OR reports.reportMessage.text=' + queryObject.queryText + ')';
      } else {
        $log.info('returning undefined from text search query function for object: ', queryObject);
        return undefined;
      }
    }
  };
});
