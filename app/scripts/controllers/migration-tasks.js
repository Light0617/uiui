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
            // Migration tasks result
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
                    },
                    pairStatuses: []
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
                        migrationTaskService.getMigrationPairs(undefined, storageSystemId, item,
                            $scope.dataModel.search.pairStatuses).then(function (result) {
                            item.volumePairs = result.resources;
                            $scope.dataModel.childrenToken = result.nextToken;
                        });
                    } else {
                        item.migrationPairs = [];
                    }
                    paginationService.clearQuery();
                },
                loadMoreChildren: function (item) {
                    if (item.hasOwnProperty('volumePairs') &&
                        item.volumePairs.length >= paginationService.PAGE_SIZE &&
                        $scope.dataModel.childrenToken !== null && !$scope.dataModel.busyLoadingMoreChildren) {
                        $scope.dataModel.busyLoadingMoreChildren = true;

                        migrationTaskService.getMigrationPairs($scope.dataModel.childrenToken, storageSystemId,
                            item, $scope.dataModel.search.pairStatuses).then(function (result) {
                                item.volumePairs = item.volumePairs.concat(result.resources);
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
                },
                filterPairs: function (pairStatus) {
                    $scope.dataModel.pairFiltering = true;
                    var pairStatuses = $scope.dataModel.search.pairStatuses;
                    if (pairStatuses.indexOf(pairStatus) >= 0) {
                        pairStatuses.some(function (value, i) {
                            if (value === pairStatus) {
                                pairStatuses.splice(i, 1);
                            }
                        });
                    } else {
                        pairStatuses.push(pairStatus);
                    }
                    var openedItem = _.find($scope.dataModel.filteredList, function (item) {
                        return item.opened;
                    });
                    if (openedItem) {
                        migrationTaskService.getMigrationPairs(undefined, storageSystemId, openedItem,
                            $scope.dataModel.search.pairStatuses).then(function (result) {
                            openedItem.volumePairs = result.resources;
                            $scope.dataModel.childrenToken = result.nextToken;
                            $scope.dataModel.pairFiltering = false;
                        });
                    }
                }
            };

            var actions = [
                {
                    icon: 'icon-edit',
                    tooltip :'action-tooltip-edit-migration-tasks',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() &&
                            _.every(dataModel.getSelectedItems(), function (item) {
                                return item.isScheduled();
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
                    tooltip :'action-tooltip-interrupt-migrations-in-progress',
                    type: 'confirm',
                    confirmTitle: 'migration-task-interrupt-confirmation',
                    confirmMessage: 'migration-task-interrupt-selected-content',
                    enabled: function () {
                        return dataModel.anySelected() &&
                            _.every(dataModel.getSelectedItems(), function (item) {
                                return item.isInProgress();
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
                    tooltip :'action-tooltip-delete-migration-tasks',
                    type: 'confirm',
                    confirmTitle: 'migration-task-delete-confirmation',
                    confirmMessage: 'migration-task-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected() &&
                            _.every(dataModel.getSelectedItems(), function (item) {
                                return !item.isInProgress();
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

            dataModel.gridSettings = [
                {
                    title: synchronousTranslateService.translate('migration-task-list-id'),
                    sizeClass: 'sixteenth',
                    sortField: 'migrationTaskId',
                    getDisplayValue: function (item) {
                        return item.migrationTaskId;
                    }
                },
                {
                    title: synchronousTranslateService.translate('migration-task-list-name'),
                    sizeClass: 'sixth',
                    sortField: 'migrationTaskName',
                    getDisplayValue: function (item) {
                        return item.migrationTaskName;
                    }
                },
                {
                    title: synchronousTranslateService.translate('migration-task-list-scheduled-date'),
                    sizeClass: 'sixth',
                    sortField: 'scheduleDate',
                    getDisplayValue: function (item) {
                        return item.toDisplayDate(item.scheduleDate);
                    }
                },
                {
                    title: synchronousTranslateService.translate('migration-task-list-status'),
                    sizeClass: 'seventh',
                    sortField: 'status',
                    getDisplayValue: function (item) {
                        return item.toDisplayStatus();
                    },
                    getType: function (item) {
                        return !item.isScheduled() ? 'hyperLink' : '';
                    },
                    onClick: function (item) {
                        var path = ['jobs', item.jobId].join('/');
                        $location.path(path);
                    }
                },
                {
                    title: synchronousTranslateService.translate('migration-task-list-job-start'),
                    sizeClass: 'sixth',
                    sortField: 'jobStartDate',
                    getDisplayValue: function (item) {
                        return item.toDisplayDate(item.jobStartDate);
                    }
                },
                {
                    title: synchronousTranslateService.translate('migration-task-list-job-end'),
                    sizeClass: 'sixth',
                    sortField: 'jobEndDate',
                    getDisplayValue: function (item) {
                        return item.toDisplayDate(item.jobEndDate);
                    }
                },
                 {
                     title: synchronousTranslateService.translate('migration-task-list-comments'),
                     sizeClass: 'sixth',
                     sortField: 'comments',
                     getDisplayValue: function (item) {
                         return item.comments;
                     }
                 }
            ];


            var updateList = function (items) {
                if ($scope.dataModel.pairFiltering) {
                    return items;
                }
                _.forEach (items, function (d) {
                    $('#' + d.id).attr('aria-expanded', 'false');
                    d.opened = false;
                    if (d.hasOwnProperty('volumePairs')) {
                        d.volumePairs = [];
                    }
                });
                return items;
            };

            $scope.dataModel = dataModel;
            scrollDataSourceBuilderService.setupDataLoader($scope, migrationTasks, 'migrationTasksSearch', false, updateList);
        });

    });
