'use strict';

angular.module('grizzly').constant('JOB_LIST_HEADER_COLUMNS', [{
  titleKey: 'jobs-page-list-col-header-status',
  sort: true,
  sortProperty: 'status',
  styles: 'cell tenth'
}, {
  titleKey: 'jobs-page-list-col-header-title',
  sort: true,
  sortProperty: 'title.text',
  styles: 'cell quarter'
}, {
  titleKey: 'jobs-page-list-col-header-user',
  sort: true,
  sortProperty: 'user',
  styles: 'cell quarter'
}, {
  titleKey: 'jobs-page-list-col-header-start-date',
  sort: true,
  sortProperty: 'startDate',
  styles: 'cell fifth'
}, {
  titleKey: 'jobs-page-list-col-header-end-date',
  sort: true,
  sortProperty: 'endDate',
  styles: 'cell fifth'
}])
  .constant('GET_RESOURCES_FUNCTION', function (result) {
    return result.jobs;
  });
