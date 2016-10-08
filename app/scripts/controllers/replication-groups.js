'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ReplicationGroupsCtrl
 * @description
 * # ReplicationGroupsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ReplicationGroupsCtrl', function ($scope, $routeParams, $timeout, $location, $q, orchestratorService,
                                                   objectTransformService, scrollDataSourceBuilderService,
                                                   synchronousTranslateService, ShareDataService,
                                                   dataProtectionSettingsService, replicationGroupsService,
                                                   scrollDataSourceBuilderServiceNew, ReplicationGroupSInitialResult,
                                                   queryService, paginationService, dpAlertService,
                                                   storageNavigatorSessionService, constantService, replicationService) {
        var storageSystemId = $routeParams.storageSystemId;

        var sn2Action = storageNavigatorSessionService.getNavigatorSessionAction(storageSystemId, constantService.sessionScope.LOCAL_REPLICATION_GROUPS);
        sn2Action.icon = 'icon-storage-navigator-settings';
        sn2Action.tooltip = 'tooltip-configure-replication-groups';
        sn2Action.enabled = function () {
            return true;
        };

        var actions = {
            'SN2': sn2Action
        };

        $scope.summaryModel={
            getActions: function () {
                return _.map(actions);
            }
        };

        orchestratorService.dataProtectionSummaryForStorageSystem(storageSystemId).then(function (result) {
            var summaryModel = objectTransformService.transformToBreakdownSummary(result);
            summaryModel.arrayDataVisualizationModel.hideButtons = true;
            summaryModel.title = synchronousTranslateService.translate('common-replication-groups');
            summaryModel.dpAlert = dpAlertService;
            summaryModel.getActions = $scope.summaryModel.getActions;
            $scope.summaryModel = summaryModel;
            $scope.summaryModel.dpAlert.update();
        });

        replicationGroupsService.getReplicationGroups(null, storageSystemId, 'initialResult').then(function (result) {
            var externalReplicationGroups = [];
            var total = result.total;
            if (ReplicationGroupSInitialResult.cloneExternalVolumePairExist) {
                externalReplicationGroups.push(new replicationGroupsService.ExternalReplicationGroup('Clone'));
                total++;
            }
            if (ReplicationGroupSInitialResult.snapshotExternalVolumePairExist) {
                externalReplicationGroups.push(new replicationGroupsService.ExternalReplicationGroup('Snap'));
                total++;
            }
            if (ReplicationGroupSInitialResult.snapshotExtendableExternalVolumePairExist) {
                externalReplicationGroups.push(new replicationGroupsService.ExternalReplicationGroup('Snap on Snap'));
                total++;
            }
            if (ReplicationGroupSInitialResult.snapshotFullcopyExternalVolumePairExist) {
                externalReplicationGroups.push(new replicationGroupsService.ExternalReplicationGroup('Snap Clone'));
                total++;
            }
            $scope.replicationGroups = result.resources.concat(externalReplicationGroups);
            var dataModel = {
                storageSystemId: storageSystemId,
                singleView: true,
                view: 'list',
                onlyOperation: true,
                noAlerts: true,
                noIcon: true,
                replicationGroups: $scope.replicationGroups,
                allItemsSelected: false,
                enableRestore: false,
                noVolumePairSelected: true,
                nextToken: result.nextToken,
                total: total,
                childrenToken: null,
                busy: false,
                busyLoadingMoreChildren: false,
                currentPageCount: 0,
                sort: {
                    field: 'id',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                queryService.setSort(f, !$scope.dataModel.sort.reverse);
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            } else {
                                $scope.dataModel.sort.field = f;
                                queryService.setSort(f, false);
                                $scope.dataModel.sort.reverse = false;
                            }
                            replicationGroupsService.getSortedAndFilteredReplicationGroups(storageSystemId, externalReplicationGroups)
                                .then(function(result) {
                                    $scope.filterModel.updateResultAndTokenAndCounts(result);
                            });
                        });
                    }
                },
                fetchFirstPageChildren: function (item) {
                    if (item.opened) {
                        replicationGroupsService.getVolumePairsForOneReplicationGroup(null, storageSystemId, item)
                            .then(function (result) {
                                _.forEach(result.resources, function (item) {
                                    objectTransformService.transformVolumePairs(item);
                                });
                                item.volumePairs = result.resources;
                                $scope.dataModel.childrenToken = result.nextToken;
                            });
                    } else {
                        item.volumePairs = [];
                    }
                    paginationService.clearQuery();
                },
                loadMoreChildren: function (item) {
                    if (item.hasOwnProperty('volumePairs') && item.volumePairs.length >= paginationService.PAGE_SIZE &&
                        $scope.dataModel.childrenToken !== null && !$scope.dataModel.busyLoadingMoreChildren) {
                        $scope.dataModel.busyLoadingMoreChildren = true;
                        replicationGroupsService.getVolumePairsForOneReplicationGroup($scope.dataModel.childrenToken,
                            storageSystemId, item).then(function (result) {
                                _.forEach(result.resources, function (item) {
                                    objectTransformService.transformVolumePairs(item);
                                });
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
                }
            };

            var actions = [
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit-replication-groups',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && dataModel.noVolumePairSelected;
                    },
                    onClick: function () {
                        $scope.replicationGroupEdit(dataModel.getSelectedItems());
                    }
                },
                {
                    icon: 'icon-pause',
                    tooltip: 'action-tooltip-suspend-replication-groups',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && dataModel.noVolumePairSelected;
                    },
                    onClick: function () {
                        $scope.replicationGroupSuspendResumeDelete('suspend', dataModel.getSelectedItems());
                    },
                },
                {
                    icon: 'icon-play',
                    tooltip: 'action-tooltip-resume-replication-groups',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && dataModel.noVolumePairSelected;
                    },
                    onClick: function () {
                        $scope.replicationGroupSuspendResumeDelete('resume', dataModel.getSelectedItems());
                    },
                },
                {
                    icon: 'icon-delete',
                    tooltip: 'action-tooltip-delete-replication-groups',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && dataModel.noVolumePairSelected;
                    },
                    onClick: function () {
                        $scope.replicationGroupSuspendResumeDelete('delete', dataModel.getSelectedItems());
                    },
                },
                {
                    icon: 'icon-refresh',
                    tooltip: 'action-tooltip-restore-replication-groups',
                    type: 'confirm',
                    confirmTitle: 'replication-group-actions-restore-confirmation-title',
                    confirmMessage: 'replication-group-actions-restore-confirmation-message',
                    onClick: function () {
                        $scope.replicationGroupRestore();
                    },
                    enabled: function () {
                        return !dataModel.anySelected() && dataModel.enableRestore;
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

            dataModel.getResources = function () {
                return replicationGroupsService.getReplicationGroups($scope.dataModel.nextToken, storageSystemId);
            };

            dataProtectionSettingsService.setReplicationGroupGridSettings(dataModel);
            dataModel.cachedList = $scope.replicationGroups;
            dataModel.displayList = $scope.replicationGroups.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel = dataModel;
            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, $scope.replicationGroups);
            dataProtectionSettingsService.setDataModelFunctions($scope);
            dataProtectionSettingsService.setReplicationGroupActions($scope, storageSystemId);
            $scope.filterModel = {
                $rawTypes: replicationService.rawTypes,
                filter: {
                    freeText: '',
                    type: '',
                },
                updateResultAndTokenAndCounts: function (result) {
                    $scope.dataModel.nextToken = result.nextToken;
                    $scope.dataModel.cachedList = result.resources;
                    $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                    _.forEach ($scope.dataModel.displayList, function (d) {
                        $('#' + d.id).attr('aria-expanded', 'false');
                    });
                    $scope.dataModel.itemCounts = {
                        filtered: $scope.dataModel.displayList.length,
                        total: $scope.dataModel.total
                    };
                },
                queryGenerationFunctions: {
                    setTypeSearch: replicationGroupsService.setTypeSearch,
                    setTextSearch: replicationGroupsService.setTextSearch
                },
                newSortOrFilterRequest: function(queryGenerationFunction) {
                    queryGenerationFunction($scope.filterModel.filter);
                    replicationGroupsService.getSortedAndFilteredReplicationGroups(storageSystemId, externalReplicationGroups)
                        .then(function(result) {
                        $scope.filterModel.updateResultAndTokenAndCounts(result);
                    });
                }
            };
        });
    });
