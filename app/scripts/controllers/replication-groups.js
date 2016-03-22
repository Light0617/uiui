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
                                                      queryService, paginationService, storageSystemVolumeService) {
        var storageSystemId = $routeParams.storageSystemId;

        orchestratorService.dataProtectionSummaryForStorageSystem(storageSystemId).then(function (result) {
            var summaryModel = objectTransformService.transformToBreakdownSummary(result);
            summaryModel.arrayDataVisualizationModel.hideButtons = true;
            summaryModel.title = synchronousTranslateService.translate('common-replication-groups');
            $scope.summaryModel = summaryModel;
        });

        replicationGroupsService.getReplicationGroups(null, storageSystemId, 'initialResult').then(function (result) {
            if (ReplicationGroupSInitialResult.cloneExternalVolumePairExist) {
                result.resources.push(new replicationGroupsService.ExternalReplicationGroup('Clone'));
            }
            if (ReplicationGroupSInitialResult.snapshotExternalVolumePairExist) {
                result.resources.push(new replicationGroupsService.ExternalReplicationGroup('Snapshot'));
            }

            $scope.replicationGroups = result.resources;

            var dataModel = {
                storageSystemId: storageSystemId,
                singleView: true,
                view: 'list',
                onlyOperation: true,
                noAlerts:  true,
                noIcon: true,
                replicationGroups: $scope.replicationGroups,
                allItemsSelected: false,
                enableRestore: false,
                noVolumePairSelected: true,
                nextToken: result.nextToken,
                total: result.total,
                childrenToken: null,
                busy: false,
                busyLoadingMoreChildren: false,
                currentPageCount: 0,
                displayList: result.resources,
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
                            paginationService.getQuery(storageSystemVolumeService.REPLICATION_GROUPS_PATH,
                                objectTransformService.transformReplicationGroup, storageSystemId).
                                then(function(result) {
                                $scope.filterModel.updateResultAndTokenAndCounts(result);
                            });
                        });
                    }
                },
                fetchFirstPageChildren: function (item) {
                    replicationGroupsService.getVolumePairsForOneReplicationGroup(null, storageSystemId, item)
                        .then(function (result){
                            _.forEach (result.resources, function (item) {
                                objectTransformService.transformVolumePairs(item);
                            });
                            item.volumePairs = result.resources;
                            $scope.dataModel.childrenToken = result.nextToken;
                    });
                    paginationService.clearQuery();
                },
                loadMoreChildren: function (item) {
                    if (item.hasOwnProperty('volumePairs') && item.volumePairs.length >= paginationService.PAGE_SIZE &&
                    $scope.dataModel.childrenToken !== null && !$scope.dataModel.busyLoadingMoreChildren) {
                        $scope.dataModel.busyLoadingMoreChildren = true;
                        replicationGroupsService.getVolumePairsForOneReplicationGroup($scope.dataModel.childrenToken,
                            storageSystemId, item).then(function (result) {
                                item.volumePairs = item.volumePairs.concat(result.resources);
                                $scope.dataModel.childrenToken = result.nextToken;
                                $scope.dataModel.busyLoadingMoreChildren = false;
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

            dataModel.getResources = function() {
                return replicationGroupsService.getReplicationGroups($scope.dataModel.nextToken, storageSystemId);
            };

            dataProtectionSettingsService.setReplicationGroupGridSettings(dataModel);
            $scope.dataModel = dataModel;
            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, $scope.replicationGroups);
            dataProtectionSettingsService.setDataModelFunctions($scope);
            dataProtectionSettingsService.setReplicationGroupActions($scope, storageSystemId);
            $scope.filterModel = {
                filter: {
                    freeText: '',
                    type: '',
                },
                updateResultAndTokenAndCounts: function(result) {
                    $scope.dataModel.nextToken = result.nextToken;
                    $scope.dataModel.displayList = result.resources;
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
                    replicationGroupsService.getSortedAndFilteredReplicationGroups(storageSystemId).then(function(result) {
                        $scope.filterModel.updateResultAndTokenAndCounts(result);
                    });
                }
            };
        });
    });
