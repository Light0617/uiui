/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:MigrationTasksCtrl
 * @description
 * # MigrationTasksCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('MigrationTasksCtrl', function ($scope, $routeParams, $timeout, $filter, orchestratorService,
                                                objectTransformService, synchronousTranslateService,
                                                scrollDataSourceBuilderService, $location, paginationService,
                                                queryService, storageNavigatorSessionService,
                                                constantService, resourceTrackerService, migrationTaskService) {
        var storageSystemId = $routeParams.storageSystemId;
        var MIGRATION_TASKS_PATH = 'migration-tasks';
        var storageSystem;

        // Get storage system
        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            $scope.storageSystemModel = result.model;
            storageSystem = result;
            // Get all migration groups
            return paginationService.getAllPromises(null, MIGRATION_TASKS_PATH, true, storageSystemId,
                objectTransformService.transformMigrationTask);
        }).then(function (result) {
            // Get and merge job info
            return migrationTaskService.mergeJobInfo(result);
        }).then(function (result) {
            // Migration groups result
            var migrationTasks = result;

            var dataModel = {
                title: synchronousTranslateService.translate('common-migration-tasks'),
                storageSystemId: storageSystemId,
                noAlerts: true,
                noIcon: true,
                total: result.length,
                view: 'list',
                noViewSwitch: true,
                allItemsSelected: false,
                search: {
                    freeText: '',
                    scheduled: false,
                    inProgress: false,
                    success: false,
                    failed: false,
                    successWithErrs: false,
                    isStatusFiltered: function () {
                        var self = this;
                        return self.scheduled || self.inProgress || self.success || self.failed || self.successWithErrs;
                    }
                },
                sort: {
                    field: 'defaultSortKey',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                queryService.setSort(f, !$scope.dataModel.sort.reverse);
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            } else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                },
                fetchFirstPageChildren: function (item) {
                    if (item.opened) {
                        migrationTaskService.getMigrationPairs(0, storageSystemId, item).then(function (result) {
                            item.migrationPairs = result.resources;
                            $scope.dataModel.childrenToken = result.nextToken;
                        });
                    } else {
                        item.migrationPairs = [];
                    }
                    paginationService.clearQuery();
                },
                loadMoreChildren: function (item) {
                    if (item.hasOwnProperty('migrationPairs') &&
                        item.migrationPairs.length >= paginationService.PAGE_SIZE &&
                        $scope.dataModel.childrenToken !== null && !$scope.dataModel.busyLoadingMoreChildren) {
                        $scope.dataModel.busyLoadingMoreChildren = true;

                        migrationTaskService.getMigrationPairs($scope.dataModel.childrenToken, storageSystemId,
                            item).then(function (result) {
                                item.migrationPairs = item.migrationPairs.concat(result.resources);
                                $scope.dataModel.childrenToken = result.nextToken;
                                //Add a short time delay to avoid multiple backend calls
                                setTimeout(function() {
                                    $scope.dataModel.busyLoadingMoreChildren = false;
                                    // Need to trigger digest loop manually inside setTimeout
                                    $scope.$apply();
                                }, 1000);
                            });
                    }
                },
                getSelectedCount: function () {
                    var selectedCount = 0;
                    _.forEach($scope.dataModel.filteredList, function (migrationTask) {
                        if (migrationTask.selected === true) {
                            selectedCount++;
                        }
                    });
                    return selectedCount;
                }
            };

            var actions = [
                {
                    icon: 'icon-edit',
                    tooltip :'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() &&
                            _.every(dataModel.getSelectedItems(), function (mg) {
                                return migrationTaskService.isScheduled(mg.status);
                            });
                    },
                    onClick: function () {
                        var item = _.first(dataModel.getSelectedItems());
                        $location.path(['storage-systems', storageSystemId, 'migration-tasks',
                            item.migrationTaskId, 'update'].join('/'));
                    }
                },
                {
                    icon: 'icon-stop',
                    tooltip :'migration-tasks-action-tooltip-interrupt',
                    type: 'confirm',
                    confirmTitle: 'migration-task-interrupt-confirmation-title',
                    confirmMessage: 'migration-task-interrupt-confirmation-message',
                    enabled: function () {
                        return dataModel.anySelected() &&
                            _.every(dataModel.getSelectedItems(), function (mg) {
                                return migrationTaskService.isInProgress(mg.status);
                            });
                    },
                    onClick: function () {
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            orchestratorService.interruptMigrationTask(storageSystemId, item.migrationTaskId);
                        });
                    }
                },
                {
                    icon: 'icon-delete',
                    tooltip :'action-tooltip-delete',
                    type: 'confirm',
                    confirmTitle: 'migration-task-delete-confirmation-title',
                    confirmMessage: 'migration-task-delete-confirmation-message',
                    enabled: function () {
                        return dataModel.anySelected() &&
                            _.every(dataModel.getSelectedItems(), function (mg) {
                                return !migrationTaskService.isInProgress(mg.status);
                            });
                    },
                    onClick: function () {
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            orchestratorService.deleteMigrationTask(storageSystemId, item.migrationTaskId);
                        });
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

            var dateDisplayFormat = function (isoDate) {
                if (isoDate && isoDate !== 'N/A') {
                    return $filter('date')(isoDate, 'MMM d, y h:mm:ss a');
                }
                return 'N/A';
            };

            dataModel.gridSettings = [
                {
                    title: 'Name',
                    sizeClass: 'sixth',
                    sortField: 'migrationTaskName',
                    getDisplayValue: function (item) {
                        return item.migrationTaskName;
                    }
                },
                {
                    title: 'Schedule Date',
                    sizeClass: 'sixth',
                    sortField: 'scheduleDate',
                    getDisplayValue: function (item) {
                        return dateDisplayFormat(item.scheduleDate);
                    }
                },
                {
                    title: 'Status',
                    sizeClass: 'sixth',
                    sortField: 'status',
                    getDisplayValue: function (item) {
                        return migrationTaskService.toDisplayStatus(item.status);
                    },
                    getType: function (item) {
                        return !migrationTaskService.isScheduled(item.status) ? 'hyperLink' : '';
                    },
                    onClick: function (item) {
                        var path = ['jobs', item.jobId].join('/');
                        $location.path(path);
                    }
                },
                {
                    title: 'Job Start',
                    sizeClass: 'sixth',
                    sortField: 'jobStartDate',
                    getDisplayValue: function (item) {
                        return dateDisplayFormat(item.jobStartDate);
                    }
                },
                {
                    title: 'Job End',
                    sizeClass: 'sixth',
                    sortField: 'jobEndDate',
                    getDisplayValue: function (item) {
                        return dateDisplayFormat(item.jobEndDate);
                    }
                },
                 {
                     title: 'Comments',
                     sizeClass: 'sixth',
                     sortField: 'comments',
                     getDisplayValue: function (item) {
                         return dateDisplayFormat(item.comments);
                     }
                 }
            ];

            $scope.dataModel = dataModel;
            scrollDataSourceBuilderService.setupDataLoader($scope, migrationTasks, 'migrationTasksSearch');
        });
    });
