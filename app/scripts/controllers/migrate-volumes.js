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
    .controller('MigrateVolumesCtrl', function($scope, $modal, $routeParams, $q, $filter, orchestratorService,
                                               viewModelService, ShareDataService, paginationService, queryService,
                                               objectTransformService, constantService, $location, $timeout,
                                               scrollDataSourceBuilderServiceNew, resourceTrackerService,
                                               synchronousTranslateService, migrationTaskService, utilService) {

        $scope.dataModel = {};
        $scope.validationForm = {};

        var getStoragePoolsPath = 'storage-pools';

        var totalVolumeSize = 0;
        var sourceVolumePools = {};
        var storageSystemId = $routeParams.storageSystemId;
        var migrationTaskId = $routeParams.migrationTaskId;
        var selectedVolumes = ShareDataService.selectedMigrateVolumes;
        var selectedTargetPoolId;

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
                // TODO Use usedCapacity for DP-VOL and totalCapacity for External-VOL. I will fix it later.
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
            var selectedTargetPoolExist = false;
            _.forEach(pools, function (pool) {
                // HDP or HDT
                if (pool.type !== 'HDT' && pool.type !== 'HDP') {
                    return;
                }
                // Not source pool
                if (sourceVolumePools[pool.storagePoolId]) {
                    return;
                }
                // Not over utilization threshold2
                var poolTotalCapacity = pool.availableCapacityInBytes.value + pool.usedCapacityInBytes.value;
                var utilizationLimitSize = pool.utilizationThreshold2 * poolTotalCapacity / 100;
                if (pool.usedCapacityInBytes.value + totalVolumeSize > utilizationLimitSize) {
                    return;
                }
                availablePools.push(pool);
                selectedTargetPoolExist = selectedTargetPoolExist || (selectedTargetPoolId === pool.storagePoolId);
            });
            _.forEach(availablePools, function (pool) {
                pool.disabledCheckBox = selectedTargetPoolExist && (pool.storagePoolId !== selectedTargetPoolId);
                pool.selected = selectedTargetPoolExist && (pool.storagePoolId === selectedTargetPoolId);
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

        var toDisplayTime = function (datetime) {
            return $filter('date')(datetime, 'h:mm a');
        };

        var getPools = function(storageSystemId, editSetting) {
            paginationService.get(null, getStoragePoolsPath, objectTransformService.transformPool, true,
                storageSystemId).then(function (result) {
                paginationService.clearQuery();
                //add for button
                var storagePools = enablePools(result.resources);
                var dataModel = {
                    title: isCreateAction ? 'migrate-volumes-title-create' : 'migrate-volumes-title-update',
                    noPageTitle: true,
                    onlyOperation: true,
                    view: 'tile',
                    storageSystemId: storageSystemId,
                    nextToken: result.nextToken,
                    total: result.total,
                    currentPageCount: 0,
                    storageSystems: $scope.dataModel.storageSystems,
                    selectedVolumes: $scope.dataModel.selectedVolumes,
                    migrationTaskNameRegexp: /^[,./0-9:@A-Z\\_a-z][,-./0-9:@A-Z\\_a-z]*$/,
                    busy: false,
                    adjustWizardRightPanel: true,
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
                    confirmTitle: synchronousTranslateService.translate('migrate-volumes-no-pool-confirmation-title'),
                    confirmMessage: synchronousTranslateService.translate('migrate-volumes-no-pool-confirmation-message'),
                    canGoNext: function () {
                        return dataModel.selectedVolumes && dataModel.selectedVolumes.length <= 300 &&
                                _.some(dataModel.displayList, 'selected');
                    },

                    next: function () {
                        if (dataModel.selectPoolModel.canGoNext && dataModel.selectPoolModel.canGoNext()) {
                            if (!dataModel.settingModel.migrationTaskName) {
                                dataModel.settingModel.migrationTaskName = getTargetPool().label;
                            }
                            dataModel.goNext();
                        }
                    },
                    validation: true,
                    itemSelected: false
                };

                dataModel.settingModel = {
                    noAvailableArray: false,
                    canSubmit: function () {
                        return dataModel.settingModel.migrationTaskName;
                    },
                    submit: function () {
                        dataModel.goNext();
                        var targetPool = getTargetPool();
                        var sourceVolumeIds = _.map(dataModel.selectedVolumes, function (volume) {
                            return volume.volumeId;
                        });
                        var schedule = null;
                        if (dataModel.settingModel.scheduleType === 'Scheduled') {
                            var localDate = new Date(dataModel.settingModel.schedule.dateDisplay);
                            var scheduleDate = new Date(dataModel.settingModel.schedule.time.getTime());
                            scheduleDate.setFullYear(localDate.getFullYear());
                            scheduleDate.setMonth(localDate.getMonth());
                            scheduleDate.setDate(localDate.getDate());

                            schedule = {
                                datetime: scheduleDate.toISOString()
                            };
                        } else {
                            if (dataModel.settingModel.schedule.currentDate &&
                                dataModel.settingModel.schedule.currentDate.datetime) {
                                // schedule is changed to immediately
                                schedule = {};
                            }
                        }
                        var payload = {
                            targetPoolId: targetPool.storagePoolId,
                            migrationTaskName: dataModel.settingModel.migrationTaskName,
                            comments: dataModel.settingModel.comments,
                            schedule: schedule
                        };
                        if (isCreateAction) {
                            payload.sourceVolumeIds = sourceVolumeIds;
                            // TODO Is confirmation popup necessary?
                            //var confirmationMessage =
                            //    synchronousTranslateService.translate('migrate-volumes-submit-confirmation-create');
                            //    // Migrate Volumes Confirmation
                            //resourceTrackerService.showPopUp(confirmationMessage, storageSystemId, null, payload,
                            //                                 orchestratorService.createMigrationTask);
                            orchestratorService.createMigrationTask(storageSystemId, payload).then(function () {
                                window.history.back();
                            });
                        } else {
                            // TODO Is confirmation popup necessary?
                            //var confirmationMessage =
                            //    synchronousTranslateService.translate('migrate-volumes-submit-confirmation-update');
                            //    // Edit Migration Task Confirmation
                            //resourceTrackerService.showPopUp(confirmationMessage, storageSystemId, migrationTaskId,
                            //                                 payload, orchestratorService.updateMigrationTask);
                            orchestratorService.updateMigrationTask(storageSystemId, migrationTaskId, payload).then(function () {
                                window.history.back();
                            });
                        }
                    },
                    previous: function () {
                        dataModel.goBack();
                    },
                    validation: true,
                    itemSelected: false,
                    migrationTaskName: null,
                    comments: '',
                    schedule: {
                        currentDate: {},
                        time: new Date(),
                        date: new Date(),
                        dateDisplay: '',
                        timeDisplay: ''
                    },
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
                    poolTypeHtiDisabled: true,
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
                migrationTaskService.setPoolsGridSetting(dataModel);

                dataModel.cachedList = storagePools;
                dataModel.displayList = storagePools.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                if (isCreateAction) {
                    dataModel.getResources = function () {
                        return paginationService.get($scope.dataModel.nextToken, getStoragePoolsPath, objectTransformService.transformPool, false, storageSystemId);
                    };
                } else {
                    editSetting(dataModel);
                }

                dataModel.isValidDate = function (form) {
                    var parseDate = new Date(dataModel.settingModel.schedule.dateDisplay);
                    if (_.isNaN(parseDate.getTime())) {
                        // date format is not valid.
                        form.date.$setValidity('text', false);
                    } else {
                        // date format is valid.
                        form.date.$setValidity('text', true);
                    }
                };

                $scope.dataModel = dataModel;

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, storagePools, 'storagePoolSearch');

            });
        };

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
                    getPools(storageSystemId, function(dataModel) {
                        var targetPool = _.find(dataModel.displayList, function (item) {
                            return item.storagePoolId === targetPoolId;
                        });
                        if (targetPool) {
                            targetPool.selected = true;
                        }
                        dataModel.settingModel.migrationTaskName = migrationTask.migrationTaskName;
                        dataModel.settingModel.comments = migrationTask.comments;
                        dataModel.settingModel.scheduleType = 'Scheduled';
                        // TODO NEWRAIN-8104: If cached migration task has already started, how should we do?
                        dataModel.settingModel.schedule.currentDate = migrationTask.schedule;
                        if (migrationTask.schedule && migrationTask.schedule.datetime) {
                            var datetime = migrationTask.schedule.datetime;
                            dataModel.settingModel.schedule.time = new Date(datetime);
                            dataModel.settingModel.schedule.date = new Date(datetime);
                            dataModel.settingModel.schedule.timeDisplay = toDisplayTime(datetime);
                            dataModel.settingModel.schedule.dateDisplay = $filter('date')(datetime, 'MMM d, y');
                        }
                    });
                });
            });
        };

        // Get candidate pools
        if (isCreateAction) {
            calculateVolumes(selectedVolumes);
            // Get candidate pools
            getPools(storageSystemId, null);
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
            if (!$scope.dataModel.settingModel.schedule.date) {
                $scope.dataModel.settingModel.schedule.date = new Date();
                $scope.dataModel.settingModel.schedule.time = new Date();
            }
        }, true);

        //user can only select one pool
        $scope.$watch('selectedCount', function (count) {
            _.map($scope.dataModel.displayList, function (storagePool) {
                storagePool.disabledCheckBox = !(count === 0 || (count === 1 && storagePool.storagePoolId === $scope.dataModel.getSelectedItems()[0].storagePoolId));
            });
            if (utilService.isNullOrUndef(count) || count === 0) {
                selectedTargetPoolId = undefined;
            } else {
                selectedTargetPoolId = $scope.dataModel.getSelectedItems()[0].storagePoolId;
            }
        });

        $scope.$watch('dataModel.settingModel.schedule.date', function (newVal, oldVal) {
            if ($scope.dataModel.settingModel) {
                $scope.dataModel.settingModel.schedule.dateDisplay = $filter('date')(newVal, 'MMM d, y');
            }
        });
    });
