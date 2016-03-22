'use strict';

angular.module('grizzly').controller('jobsController', function ($rootScope, $scope, $location, $log, initialResult, grizzlyService,
                                                                 queryService, JOB_LIST_HEADER_COLUMNS, GET_RESOURCES_FUNCTION) {
  $scope.model = {
    initialResult: initialResult,
    listHeaderColumns: JOB_LIST_HEADER_COLUMNS,
    getResourcesFunction: GET_RESOURCES_FUNCTION,
    sortAndFilterResourcesFunction: function () {
      if (queryService.queryMap['textSearch'].queryText){
        queryService.removeQueryMapEntry('_missing_', false);
      }else {
        queryService.setQueryMapEntry('_missing_', 'parentJobId', false);
      }

      return grizzlyService.getSortedAndFilteredJobs();
    },
    textSearchQueryFunction: function (queryObject) {
      return grizzlyService.textSearchQueryFunction(queryObject);
    },
    loadMoreFunction: function (token) {
      return grizzlyService.getJobs(token);
    },
    notificationFunction: function () {
      $rootScope.$broadcast('refreshJob');
    },
    autocompleteFunction: function ($query) {
      return grizzlyService.getJobsTags($query);
    }
  };

  $scope.queryService = queryService;

  //Watching queryService values here because datetimepicker needs to map directly to model rather than setting values
  //on queryService through set methods
  $scope.$watchGroup(['queryService.queryMap.startDate.to', 'queryService.queryMap.startDate.from',
    'queryService.queryMap.endDate.to', 'queryService.queryMap.endDate.from'], function(newValues, oldValues) {
    $log.debug('newValues ', newValues, ' oldValues ', oldValues);
    queryService.broadcastUpdate();
  });
});
