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
                                               scrollDataSourceBuilderService, resourceTrackerService,
                                               synchronousTranslateService, migrationTaskService, utilService,
                                               inventorySettingsService) {

        $scope.dataModel = {};
        $scope.validationForm = {};

        var getStoragePoolsPath = 'storage-pools';

        var totalVolumeSize = 0;
        var sourceVolumePools = {};
        var storageSystemId = $routeParams.storageSystemId;
        var migrationTaskId = $routeParams.migrationTaskId;
        var selectedVolumes = ShareDataService.selectedMigrateVolumes;
        var selectedTargetPoolId;
        var currentTargetPoolId;

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
            _.forEach(volumes, function (item) {
                if (item.type === constantService.volumeType.EXTERNAL) {
                    // Use total capacity for External-VOL.
                    totalVolumeSize += item.totalCapacity.value;
                } else {
                    totalVolumeSize += item.usedCapacity.value;
                }
                if (!utilService.isNullOrUndef(item.poolId)) {
                    sourceVolumePools[item.poolId] = true;
                }
            });
        };

        // filter unavailable pools.
        var enablePools = function (pools) {
            var availablePools = [];
            var selectedTargetPoolExist = false;
            _.forEach(pools, function (pool) {
                if (currentTargetPoolId === pool.storagePoolId) {
                    availablePools.push(pool);
                    selectedTargetPoolExist = true;
                    return;
                }
                // HDP or HDT
                if (pool.type !== 'HDT' && pool.type !== 'HDP') {
                    return;
                }
                // Not 'HSA-reserved'
                if (pool.label.indexOf(constantService.prefixReservedStoragePool) !== -1) {
                    return;
                }
                // Not source pool
                if (sourceVolumePools[pool.storagePoolId]) {
                    return;
                }
                // Not over utilization threshold2
                if (!checkUtilizationThreshold2(pool)) {
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

        var checkUtilizationThreshold2 = function (pool) {
            var poolTotalCapacity = pool.availableCapacityInBytes.value + pool.usedCapacityInBytes.value;
            var utilizationLimitSize = pool.utilizationThreshold2 * poolTotalCapacity / 100;
            return (pool.usedCapacityInBytes.value + totalVolumeSize <= utilizationLimitSize);
        };

        var updateResultTotalCounts = function(result) {
            // filter pools
            var pools = enablePools(result);
            $scope.dataModel.displayList = pools;
            $scope.dataModel.filteredList = pools;
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        var toDisplayTime = function (datetime) {
            return $filter('date')(datetime, 'h:mm a');
        };

        var getAllPools = function (isFirstCall) {
            return paginationService.getAllPromises(null, getStoragePoolsPath, isFirstCall, storageSystemId,
                            objectTransformService.transformPool);
        };

        var getPools = function(storageSystemId, editSetting) {
            // Get all pools of storageSystem, since number of pools is at most 128 and pools will be filtered in UI.
            getAllPools(true).then(function (result) {
                paginationService.clearQuery();
                var storagePools = enablePools(result);
                var dataModel = {
                    title: isCreateAction ? 'migrate-volumes-title-create' : 'migrate-volumes-title-update',
                    noPageTitle: true,
                    onlyOperation: true,
                    view: 'tile',
                    storageSystemId: storageSystemId,
                    total: result.length,
                    currentPageCount: 0,
                    storageSystems: $scope.dataModel.storageSystems,
                    selectedVolumes: $scope.dataModel.selectedVolumes,
                    migrationTaskNameRegexp: /^[a-zA-Z0-9_][a-zA-Z0-9-_]*$/,
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
                                getAllPools(false).then(function(result) {
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
                    needToConfirm: function () {
                        if (dataModel.getSelectedCount() !== 1) {
                            this.confirmTitle = synchronousTranslateService.translate('migrate-volumes-no-pool-confirmation-title');
                            this.confirmMessage = synchronousTranslateService.translate('migrate-volumes-no-pool-confirmation-message');
                            return true;
                        }
                        var pool = dataModel.getSelectedItems()[0];
                        if (pool.status !== constantService.poolStatus.NORMAL) {
                            var statusObj = {status: pool.status};
                            this.confirmTitle = synchronousTranslateService.translate(
                                'migrate-volumes-not-normal-confirmation-title', statusObj);
                            this.confirmMessage = synchronousTranslateService.translate(
                                'migrate-volumes-not-normal-confirmation-message', statusObj);
                            return true;
                        }
                        if (!checkUtilizationThreshold2(pool)) {
                            this.confirmTitle = synchronousTranslateService.translate('migrate-volumes-poor-capacity-confirmation-title');
                            this.confirmMessage = synchronousTranslateService.translate('migrate-volumes-poor-capacity-confirmation-message');
                            return true;
                        }
                        return false;
                    },

                    next: function () {
                        if (dataModel.selectPoolModel.canGoNext && dataModel.selectPoolModel.canGoNext()) {
                            if (!dataModel.settingModel.migrationTaskName) {
                                var poolLabel = getTargetPool().label;
                                dataModel.settingModel.migrationTaskName = poolLabel.replace(/[^a-zA-Z0-9-_]/g, '_');
                            }
                            dataModel.goNext();
                        }
                    },
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
                            migrationTaskName: dataModel.settingModel.migrationTaskName,
                            comments: dataModel.settingModel.comments,
                            schedule: schedule
                        };
                        if (isCreateAction || currentTargetPoolId !== targetPool.storagePoolId) {
                            payload.targetPoolId = targetPool.storagePoolId;
                        }
                        if (isCreateAction) {
                            payload.sourceVolumeIds = sourceVolumeIds;
                            orchestratorService.createMigrationTask(storageSystemId, payload).then(function () {
                                window.history.back();
                            });
                        } else {
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
                        getAllPools(false).then(function(result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    sliderQuery: function(key, start, end, unit) {
                        paginationService.setSliderSearch(key, start, end, unit);
                        getAllPools(false).then(function(result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    searchQuery: function (value) {
                        var queryObjects = [];
                        queryObjects.push(new paginationService.QueryObject('storagePoolId', new paginationService.SearchType().INT, value));
                        queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                        paginationService.setTextSearch(queryObjects);
                        getAllPools(false).then(function(result) {
                            updateResultTotalCounts(result);
                        });
                    }
                };
                inventorySettingsService.setPoolGridSettings(dataModel);

                dataModel.cachedList = storagePools;
                dataModel.displayList = storagePools;

                if (!isCreateAction) {
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

                scrollDataSourceBuilderService.setupDataLoader($scope, storagePools, 'storagePoolSearch');

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
                var sourceExternalVolumeIds = [];
                _.forEach(pairs, function(item) {
                    if (item.sourceExternalParityGroupId !== constantService.notAvailable) {
                        sourceExternalVolumeIds.push({text: item.sourceVolumeId});
                    } else {
                        sourceVolumeIds.push({text: item.sourceVolumeId});
                    }
                    selectedTargetPoolId = item.targetPoolId;
                });
                currentTargetPoolId = selectedTargetPoolId;
                var sourceVolumes = [];
                var sourceExternalVolumes = [];
                var tasks = [];
                if (sourceVolumeIds.length > 0) {
                    tasks.push(migrationTaskService.getVolumes(storageSystemId, sourceVolumeIds).then(
                        function (volumes) {
                            sourceVolumes = volumes;
                        }));
                }
                if (sourceExternalVolumeIds.length > 0) {
                    tasks.push(migrationTaskService.getExternalVolumes(storageSystemId, sourceExternalVolumeIds).then(
                        function (volumes) {
                            sourceExternalVolumes = volumes;
                        }));
                }

                $q.all(tasks).then(function () {
                    calculateVolumes(sourceVolumes);
                    getPools(storageSystemId, function(dataModel) {
                        dataModel.settingModel.migrationTaskName = migrationTask.migrationTaskName;
                        dataModel.settingModel.comments = migrationTask.comments;
                        dataModel.settingModel.scheduleType = 'Scheduled';
                        // If cached migration task has already started, we don't care here, since it will fail on submit.
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
        $scope.$watch(function() {
            return $scope.dataModel.getSelectedCount();
        }, function () {
            var count = $scope.dataModel.getSelectedCount();
            if (utilService.isNullOrUndef(count) || count === 0) {
                selectedTargetPoolId = undefined;
            } else {
                selectedTargetPoolId = $scope.dataModel.getSelectedItems()[0].storagePoolId;
            }
            _.map($scope.dataModel.filteredList, function (storagePool) {
                storagePool.disabledCheckBox = !(count === 0 || (count === 1 && storagePool.storagePoolId === selectedTargetPoolId));
            });
        });

        $scope.$watch('dataModel.settingModel.schedule.date', function (newVal) {
            if ($scope.dataModel.settingModel) {
                $scope.dataModel.settingModel.schedule.dateDisplay = $filter('date')(newVal, 'MMM d, y');
            }
        });
    });
