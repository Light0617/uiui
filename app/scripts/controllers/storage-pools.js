'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePoolsCtrl
 * @description
 * # StoragePoolsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StoragePoolsCtrl', function ($scope, $routeParams, $timeout, $filter, orchestratorService, objectTransformService, synchronousTranslateService,
                                              scrollDataSourceBuilderServiceNew, $location, paginationService, queryService, capacityAlertService,
                                              storageNavigatorSessionService, constantService, resourceTrackerService,
                                              inventorySettingsService) {
        var storageSystemId = $routeParams.storageSystemId;
        var getStoragePoolsPath = 'storage-pools';

        orchestratorService.tiers().then(function (result) {
            $scope.tiers = result.tiers;
        });

        var sn2Action = storageNavigatorSessionService.getNavigatorSessionAction(storageSystemId, constantService.sessionScope.POOLS);
        sn2Action.icon = 'icon-storage-navigator-settings';
        sn2Action.tooltip = 'tooltip-configure-storage-pools';
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

        orchestratorService.storagePoolsSummary(storageSystemId).then(function (result) {
            $scope.usageGraphs = _.map(result.summariesByType, objectTransformService.transformToSummaryByTypeModel);
        });


        $scope.$watchGroup(['dataModel', 'tiers', 'usageGraphs'], function (values) {
            var dataModel = values[0];
            if (!dataModel) {
                return;
            }
            dataModel.tiers = values[1];
            dataModel.usageGraphs = values[2];
        });

        orchestratorService.storageSystem(storageSystemId).then(function (storageSystem) {
            paginationService.get(null, getStoragePoolsPath, objectTransformService.transformPool, true, storageSystemId).then(function (result) {
                var storagePools = result.resources;
                var dataModel = {
                    title: synchronousTranslateService.translate('common-storage-system-pools'),
                    alerts: {
                        capacity: {
                            count: 0,
                            level: 'healthy'
                        },
                        dp: {
                            count: 0,
                            level: 'healthy'
                        },
                        hardware: {
                            count: 0,
                            level: 'healthy'
                        },
                        jobs: {
                            count: 0,
                            level: 'healthy'
                        }
                    },
                    storageSystemId: storageSystemId,
                    nextToken: result.nextToken,
                    total: result.total,
                    view: 'tile',
                    allItemsSelected: false,
                    sort: {
                        field: 'name',
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
                                paginationService.getQuery(getStoragePoolsPath, objectTransformService.transformPool, storageSystemId).then(function(result) {
                                    updateResultTotalCounts(result);
                                });
                            });
                        }
                    }
                };

                $scope.filterModel = {
                    filter: {
                        freeText: '',
                        freeCapacity: constantService.CAPACITY_FILTER_DEFAULT_CONDITION,
                        totalCapacity: constantService.CAPACITY_FILTER_DEFAULT_CONDITION,
                        ddmEnabled: undefined
                    },
                    filterQuery: function (key, value, type, arrayClearKey) {
                        var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                        paginationService.setFilterSearch(queryObject);
                        paginationService.getQuery(getStoragePoolsPath, objectTransformService.transformPool, storageSystemId).then(function(result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    sliderQuery: function(key, start, end, unit) {
                        paginationService.setSliderSearch(key, start, end, unit);
                        paginationService.getQuery(getStoragePoolsPath, objectTransformService.transformPool, storageSystemId).then(function(result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    searchQuery: function (value) {
                        var queryObjects = [];
                        queryObjects.push(new paginationService.QueryObject('storagePoolId', new paginationService.SearchType().INT, value));
                        queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                        paginationService.setTextSearch(queryObjects);
                        paginationService.getQuery(getStoragePoolsPath, objectTransformService.transformPool, storageSystemId).then(function(result) {
                            updateResultTotalCounts(result);
                        });
                    }
                };

                var updateResultTotalCounts = function(result) {
                    $scope.dataModel.nextToken = result.nextToken;
                    $scope.dataModel.cachedList = result.resources;
                    $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                    $scope.dataModel.itemCounts = {
                        filtered: $scope.dataModel.displayList.length,
                        total: $scope.dataModel.total
                    };
                };

                dataModel.getResources = function(){
                    return paginationService.get($scope.dataModel.nextToken, getStoragePoolsPath, objectTransformService.transformPool, false, storageSystemId);
                };
                dataModel.cachedList = storagePools;
                dataModel.displayList = storagePools.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                var actions = [
                    {
                        icon: 'icon-delete',
                        tooltip :'action-tooltip-delete',
                        type: 'confirm',
                        confirmTitle: 'storage-pool-delete-confirmation',
                        confirmMessage: 'storage-pool-delete-selected-content',
                        enabled: function () {
                            return dataModel.anySelected() &&
                                !_.find(dataModel.getSelectedItems(), function(item) {
                                    return item.isUsingExternalStorage() || item.nasBoot;
                                });
                        },
                        onClick: function () {

                            // Build reserved resources
                            var reservedResourcesList = [];
                            var poolIds = [];
                            _.forEach(dataModel.getSelectedItems(), function (item) {
                                reservedResourcesList.push(item.storagePoolId + '=' + resourceTrackerService.storagePool());
                                poolIds.push(item.storagePoolId);
                            });

                            // Show popup if resource is present in resource tracker else submit
                            resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                                'Delete Pools Confirmation', storageSystemId, poolIds, null, orchestratorService.deleteStoragePool);
                        }
                    },
                    {
                        icon: 'icon-edit',
                        tooltip :'action-tooltip-edit',
                        type: 'link',
                        enabled: function () {
                            return dataModel.onlyOneSelected() &&
                                !_.find(dataModel.getSelectedItems(), function(item) {
                                    //edit button is disabled for ddm pools
                                    return item.isUsingExternalStorage() || item.ddmEnabled;
                                });
                        },
                        onClick: function () {
                            var item = _.first(dataModel.getSelectedItems());
                            item.actions.edit.onClick();

                        }
                    }
                ];

                dataModel.getActions = function () {
                    return actions;
                };

                inventorySettingsService.setPoolGridSettings(dataModel);

                if (storageSystem.unified) {
                    dataModel.gridSettings.push({
                        title: 'common-label-nas-boot',
                        sizeClass: 'eighteenth',
                        sortField: 'nasBoot',
                        getDisplayValue: function (item) {
                            return item.nasBoot ? 'common-label-nas-boot' : '';
                        },
                        getIconClass: function (item) {
                            return item.nasBoot ? 'icon-checkmark' : '';
                        },
                        type: 'icon'
                    });
                }

                dataModel.addAction = function () {
                    $location.path(['storage-systems', storageSystemId, 'storage-pools', 'add'].join('/'));
                };

                dataModel.capacityAlert = capacityAlertService;

                $scope.dataModel = dataModel;
                $scope.dataModel.capacityAlert.update();
                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, storagePools, 'storagePoolSearch');
            });
        });
    });
