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
 * @name rainierApp.controller:MigrateVolumesCtrl
 * @description
 * # MigrateVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('MigrateVolumesCtrl', function(
        $scope,
        $modal,
        $routeParams,
        $q,
        orchestratorService,
        viewModelService,
        ShareDataService,
        paginationService,
        queryService,
        objectTransformService,
        cronStringConverterService,
        attachVolumeService,
        replicationService,
        volumeService,
        constantService,
        $location,
        $timeout,
        scrollDataSourceBuilderServiceNew,
        inventorySettingsService,
        storageSystemVolumeService,
        dpAlertService,
        storageNavigatorSessionService,
        resourceTrackerService,
        gadVolumeTypeSearchService,
        synchronousTranslateService,
        diskSizeService,
        migrationTaskService) {

        $scope.dataModel = {};

        //add for button
        var VALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-valid-tooltip');
        //var INVALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-invalid-tooltip');

        var getStoragePoolsPath = 'storage-pools';

        var totalVolumeSize = 0;
        var sourceVolumePools = {};
        var storageSystemId = $routeParams.storageSystemId;
        var migrationTaskId = $routeParams.migrationTaskId;
        var selectedVolumes = ShareDataService.selectedMigrateVolumes;

        // check the type of action.
        var isCreateAction = true;
        if (migrationTaskId !== undefined) {
            // this is update migration task action
            isCreateAction = false;
            migrationTaskId = parseInt(migrationTaskId);
        }

        // calculate volume information
        var calculateVolumes = function (volumes) {
            $scope.dataModel.selectedVolumes = volumes;
            _.forEach(volumes, function (volume) {
                totalVolumeSize += volume.totalCapacity.value;
                if (volume.poolId !== null && volume.poolId !== undefined) {
                    sourceVolumePools[volume.poolId] = true;
                }
            });
        };

        // filter unavailable pools.
        // TODO NEWRAIN-8104: If all pools currently obtained are unavailable, auto-reloading next page would be started?
        var enablePools = function (pools) {
            var availablePools = [];
            _.forEach(pools, function (pool) {
                // HDP or HDT
                if (pool.type !== 'HDT' && pool.type !== 'HDP') {
                    return;
                }
                // Not source pool
                if (sourceVolumePools[pool.storagePoolId]) {
                    return;
                }
                // TODO NEWRAIN-8104 Total capacity is lesser than pool utilization threshold
                if (pool.availableCapacityInBytes < totalVolumeSize) {
                    return;
                }
                availablePools.push(pool);
            });
            return availablePools;
        };

        var updateResultTotalCounts = function(result) {
            // filter pools
            var pools = enablePools(result.resources);
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = pools;
            $scope.dataModel.displayList = pools.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        var setResult = function (result) {
                paginationService.clearQuery();
                //add for button
                var storagePools = enablePools(result.resources);
                var dataModel = {
                    // TODO REWRAIN-8104: When updating task, title should be changed?
                    title: isCreateAction ? 'migrate-volumes' : 'update-migration-task',
                    onlyOperation: true,
                    view: 'tile',
                    storageSystemId: storageSystemId,
                    nextToken: result.nextToken,
                    total: result.total,
                    currentPageCount: 0,
                    storageSystems: $scope.dataModel.storageSystems,
                    selectedVolumes: $scope.dataModel.selectedVolumes,
                    busy: false,
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
                var getTargetPool = function () {
                    var targetPool = _.find(dataModel.displayList, function (item) {
                        return item.selected;
                    });
                    targetPool = dataModel.getSelectedItems()[0];
                    return targetPool;
                };

                angular.extend(dataModel, viewModelService.newWizardViewModel(['selectPool', 'setting']));

                dataModel.selectPoolModel = {
                    noAvailableArray: false,
                    confirmTitle: synchronousTranslateService.translate('storage-pool-migrate-confirmation'),
                    confirmMessage: synchronousTranslateService.translate('storage-pool-migrate-zero-selected'),
                    canGoNext: function () {
                        return _.some(dataModel.displayList, 'selected');
                    },

                    next: function () {
                        if (dataModel.selectPoolModel.canGoNext && dataModel.selectPoolModel.canGoNext()) {
                            dataModel.settingModel.migrationTaskName = getTargetPool().label;
                            dataModel.goNext();
                        }
                    },
                    previous: function() {
                        dataModel.goBack();
                    },
                    validation: true,
                    itemSelected: false
                };

                dataModel.settingModel = {
                    noAvailableArray: false,
                    confirmTitle: synchronousTranslateService.translate('storage-pool-migrate-confirmation'),
                    confirmMessage: synchronousTranslateService.translate('storage-pool-migrate-zero-selected'),
                    canSubmit: function () {
                        return dataModel.settingModel.migrationTaskName;
                    },
                    submit: function () {
                        dataModel.goNext();
                        var targetPool = getTargetPool();
                        var sourceVolumeIds = _.map(dataModel.selectedVolumes, function (volume) {
                            return volume.volumeId;
                        });
                        var schedule = {};
                        if (dataModel.settingModel.scheduleType === 'Scheduled') {
                            schedule.datetime = dataModel.settingModel.scheduleDate.toISOString();
                        }
                        var payload = {
                            targetPoolId: targetPool.storagePoolId,
                            migrationTaskName: dataModel.settingModel.migrationTaskName,
                            schedule: schedule
                        };
                        if (isCreateAction) {
                            payload.sourceVolumeIds = sourceVolumeIds;
                            orchestratorService.createMigrationTask(storageSystemId, payload);
                        } else {
                            orchestratorService.updateMigrationTask(storageSystemId, migrationTaskId, payload);
                        }
                    },
                    canGoBack: function () {
                        return isCreateAction;
                    },
                    previous: function () {
                        if (dataModel.settingModel.canGoBack && dataModel.settingModel.canGoBack()) {
                            dataModel.goBack();
                        }
                    },
                    validation: true,
                    itemSelected: false,
                    migrationTaskName: '',
                    scheduleType: 'Immediately'
                };

                $scope.filterModel = {
                    filter: {
                        freeText: '',
                        freeCapacity: {
                            min: 0,
                            max: 1000,
                            unit: 'PB'
                        },
                        totalCapacity: {
                            min: 0,
                            max: 1000,
                            unit: 'PB'
                        }
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

                dataModel.cachedList = storagePools;
                dataModel.displayList = storagePools.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                if (isCreateAction) {
                    dataModel.getResources = function () {
                        return paginationService.get($scope.dataModel.nextToken, getStoragePoolsPath, objectTransformService.transformPool, false, storageSystemId);
                    };
                }
                $scope.dataModel = dataModel;

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, storagePools, 'storagePoolSearch');

        };

        var getPools = function(storageSystemId) {
            paginationService.get(null, getStoragePoolsPath, objectTransformService.transformPool, true,
                storageSystemId).then(setResult, function() {
                $scope.dataModel.displayList = [];
                $scope.dataModel.itemCounts = 0;
            });
        }

        // TODO NEWRAIN-8104: Error case.
        var getTargetMigrationTask = function () {
            var migrationTask;
            // get target migration task
            orchestratorService.migrationTask(storageSystemId, migrationTaskId).then(function (result) {
                migrationTask = result;
                // get migration pairs to obtain source volumes, target pool
                return migrationTaskService.getAllMigrationPairs(storageSystemId, migrationTaskId);
            }).then(function (pairs) {
                var sourceVolumeIds = [];
                var targetPoolId;
                _.forEach(pairs, function(item) {
                    sourceVolumeIds.push(item.sourceVolumeId);
                    targetPoolId = item.targetPoolId;
                });
                var sourceVolumes = [];
                // get each volume information
                var tasks = _.map(sourceVolumeIds, function (sourceVolumeId) {
                    return orchestratorService.volume(storageSystemId, sourceVolumeId).then(function (volume) {
                        sourceVolumes.push(volume);
                    });
                });
                $q.all(tasks).then(function () {
                    calculateVolumes(sourceVolumes);
                    orchestratorService.storagePool(storageSystemId, targetPoolId).then(function (result) {
                        var storagePools = [];
                        storagePools.push(result);
                        var resultObject = {
                            resources: storagePools,
                            nextToken: 1,
                            total: 1
                        };

                        result.selected = true;

                        // set wizard data
                        setResult(resultObject)
                        $scope.dataModel.selectPoolModel.itemSelected = true;
                        $scope.dataModel.settingModel.migrationTaskName = migrationTask.migrationTaskName;
                        // TODO NEWRAIN-8104: If cached migration task has already started, how should we do?
                        $scope.dataModel.settingModel.scheduleType = 'Scheduled';
                        if (migrationTask.schedule.datetime) {
                            $scope.dataModel.settingModel.scheduleDate = new Date(migrationTask.schedule.datetime);
                        }

                        // Target pool is selected.
                        $scope.dataModel.goNext();
                    });
                });
            });
        };

        // Get candidate pools
        if (isCreateAction) {
            calculateVolumes(selectedVolumes);
            // Get candidate pools
            getPools(storageSystemId);
        } else {
            // Get migration task, volumes and target pool
            getTargetMigrationTask();
        }

        $scope.$watch(function ($scope) {
            if ($scope.dataModel && $scope.dataModel.displayList) {
                return $scope.dataModel.displayList.map(function (item) {
                    return item.selected;
                });
            }
        }, function (newValue) {
            if (!newValue) {
                return;
            }
            var itemSelected = false;
            itemSelected = _.find($scope.dataModel.displayList, function(item){ return item.selected;}) ? true : false;

            $scope.dataModel.selectPoolModel.itemSelected = itemSelected;
            if (itemSelected) {
                $scope.dataModel.settingModel.volumeMigrationLabel = $scope.dataModel.getSelectedItems()[0].label;
            }
            if (!$scope.dataModel.settingModel.scheduleDate) {
                $scope.dataModel.settingModel.scheduleDate = new Date();
            }
        }, true);

        //user can only select one pool
        $scope.$watch('selectedCount', function (count) {
            _.map($scope.dataModel.displayList, function (storagePool) {
                storagePool.disabledCheckBox = !(count === 0 || (count === 1 && storagePool.storagePoolId === $scope.dataModel.getSelectedItems()[0].storagePoolId));
            });
        });

    });
