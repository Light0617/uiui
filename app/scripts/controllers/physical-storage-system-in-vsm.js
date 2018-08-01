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
 * @name rainierApp.controller:PhysicalStorageSystemInVsmCtrl
 * @description
 * # PhysicalStorageSystemInVsmCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('PhysicalStorageSystemInVsmCtrl', function (
        $scope, $routeParams, $location, $timeout, $window, objectTransformService, constantService,
        paginationService, ShareDataService, queryService, gadVolumeTypeSearchService, migrationTaskService,
        scrollDataSourceBuilderService, rainierQueryService, scrollDataSourceBuilderServiceNew,
        synchronousTranslateService, orchestratorService, replicationService, inventorySettingsService,
        resourceTrackerService, volumeService, virtualizeVolumeService, utilService, $modal, $q,
        storageSystemVolumeService, attachVolumeService) {

        var physicalStorageSystemId = $routeParams.physicalStorageSystemId;
        var virtualStorageMachineId = $routeParams.virtualStorageMachineId;
        var virtualStorageMachineIdList = virtualStorageMachineId.split('-');
        var storageSystemId = virtualStorageMachineIdList[0];
        var GET_VOLUMES_PATH = 'volumes?q=virtualStorageMachineInformation.virtualStorageMachineId:' + virtualStorageMachineId;

        var title = 'Physical Storage System ' + physicalStorageSystemId + ' in ' + virtualStorageMachineId;

        var initModels = function () {
            $scope.filterModel = {
                filter: {
                    freeText: '',
                    volumeType: '',
                    previousVolumeType: '',
                    provisioningStatus: '',
                    dkcDataSavingType: '',
                    replicationType: [],
                    protectionStatusList: [],
                    snapshotex: false,
                    snapshotfc: false,
                    snapshot: false,
                    clone: false,
                    protected: false,
                    unprotected: false,
                    secondary: false,
                    gadActivePrimary: false,
                    gadActiveSecondary: false,
                    gadNotAvailable: false,
                    freeCapacity: {
                        min: 0,
                        max: 1000,
                        unit: 'PB'
                    },
                    totalCapacity: {
                        min: 0,
                        max: 1000,
                        unit: 'PB'
                    },
                    utilization: {
                        min: 0,
                        max: 100
                    },
                    migrationType: ''
                }
            };

            $scope.dataModel = {
                title: title,
                view: 'tile',
                storageSystemId: physicalStorageSystemId,
                nextToken: '',
                total: '',
                currentPageCount: 0,
                busy: false,
                narrowUsageBar: true,
                sort: {
                    field: 'volumeId',
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
                            paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume,
                                storageSystemId).then(function (result) {
                                updateResultTotalCounts(result);
                            });
                        });
                    }
                }
            };
        };


        var getVolumeInventory = function () {
            return paginationService.get(null, GET_VOLUMES_PATH, objectTransformService.transformVolume, true,
                physicalStorageSystemId).then(function (result) {
                paginationService.clearQuery();

                $scope.filterModel = setFilterModel();
                $scope.dataModel = setDataModel();

                updateResultTotalCounts(result);

                inventorySettingsService.setVolumesGridSettings($scope.dataModel);
                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');
            });
        };

        var setDataModel = function () {
            var actions = volumeService.getActions($scope.dataModel, resourceTrackerService, orchestratorService, $modal,
                storageSystemId, storageSystemVolumeService, virtualizeVolumeService, utilService, paginationService,
                migrationTaskService, attachVolumeService, virtualStorageMachineId);

            return _.extend($scope.dataModel, {
                getActions: function () {
                    return actions;
                },
                getResources: function () {
                    return paginationService.get($scope.dataModel.nextToken, GET_VOLUMES_PATH,
                        objectTransformService.transformVolume, false, storageSystemId);
                }
            });
        };

        var setFilterModel = function () {
            return _.extend($scope.filterModel, {
                $replicationRawTypes: replicationService.rawTypes,
                fetchPreviousVolumeType: function (previousVolumeType) {
                    $scope.filterModel.filter.previousVolumeType = previousVolumeType;
                },
                arrayType: (new paginationService.SearchType()).ARRAY,
                filterQuery: function (key, value, type, arrayClearKey) {
                    gadVolumeTypeSearchService.filterQuery(key, value, type, arrayClearKey, $scope.filterModel);
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume,
                        storageSystemId).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                },
                migrationFilterQuery: function (type, isManaged) {
                    migrationTaskService.volumeMigrationTypeFilter(type, isManaged, $scope.filterModel.filter.migrationType);
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume,
                        storageSystemId).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                },
                sliderQuery: function (key, start, end, unit) {
                    paginationService.setSliderSearch(key, start, end, unit);
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume,
                        storageSystemId).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('volumeId',
                        new paginationService.SearchType().INT, value));
                    queryObjects.push(new paginationService.QueryObject('label',
                        new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume,
                        storageSystemId).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                }
            });
        };


        var updateResultTotalCounts = function (result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = result.resources;
            $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        initModels();
        getVolumeInventory();

    });