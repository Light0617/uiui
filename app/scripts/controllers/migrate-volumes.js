/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2017. All rights reserved.
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
        synchronousTranslateService) {

        $scope.dataModel = {};

        //add for button
        var VALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-valid-tooltip');
        //var INVALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-invalid-tooltip');

        var getStoragePoolsPath = 'storage-pools';

        var updateResultTotalCounts = function(result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = result.resources;
            $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        var getPool = function(storageSystemId) {
            paginationService.get(null, getStoragePoolsPath, objectTransformService.transformPool, true,
                storageSystemId).then(function (result) {
                paginationService.clearQuery();
                //add for button
                var noAvailableArray = false;
                var storagePools = result.resources;
                var dataModel = {
                    onlyOperation: true,
                    view: 'tile',
                    storageSystemId: storageSystemId,
                    nextToken: result.nextToken,
                    total: result.total,
                    currentPageCount: 0,
                    storageSystems: $scope.dataModel.storageSystems,
                    selectedSource: $scope.dataModel.selectedSource,
                    selectedTarget: $scope.dataModel.selectedTarget,
                    selectedVolumes: $scope.dataModel.selectedVolumes,
                    busy: false,
                    sort: {
                        field: 'name',
                        reverse: false,
                        setSort: function (f) {
                            $timeout(function () {
                                if ($scope.dataModel.sort.field === f) {
                                    queryService.setSort(f, !$scope.dataModelPool.sort.reverse);
                                    $scope.dataModel.sort.reverse = !$scope.dataModelPool.sort.reverse;
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

                angular.extend(dataModel, viewModelService.newWizardViewModel(['selectPool']));

                // Todo: next step of confirmation needs further discussion
                dataModel.selectPoolModel = {
                    noAvailableArray: noAvailableArray,
                    confirmTitle: synchronousTranslateService.translate('storage-pool-migrate-confirmation'),
                    confirmMessage: synchronousTranslateService.translate('storage-pool-migrate-zero-selected'),
                    canGoNext: function () {
                        return _.some(dataModel.displayList, 'selected');
                    },

                    //TODO: next step of confirmation needs further discussion
                    next: function () {
                        if (dataModel.selectPoolModel.canGoNext && dataModel.selectPoolModel.canGoNext()) {
                            dataModel.goNext();
                        }
                    },
                    previous: function() {
                        dataModel.goBack();
                    },
                    validation: true,
                    itemSelected: false
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

                dataModel.getResources = function () {
                    return paginationService.get($scope.dataModel.nextToken, getStoragePoolsPath, objectTransformService.transformPool, false, storageSystemId);
                };
                $scope.dataModel = dataModel;

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, storagePools, 'storagePoolSearch');


            }, function() {
                $scope.dataModel.displayList = [];
                $scope.dataModel.itemCounts = 0;
            });
        };


        paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result){
            $scope.dataModel.storageSystems = result;
            $scope.dataModel.selectedSource = _.first($scope.dataModel.storageSystems);
            $scope.dataModel.selectedTarget = _.first($scope.dataModel.storageSystems);
            var storageSystemId = $scope.dataModel.selectedSource.storageSystemId;
            //Selected volumes from the volume inventory page
            $scope.dataModel.selectedVolumes = ShareDataService.selectedMigrateVolumes;
            getPool(storageSystemId);
        });

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
        }, true);

        $scope.$watch('dataModel.selectedTarget', function(newValue) {
            if(newValue) {
                getPool(newValue.storageSystemId);
            }
        });

        //user can only select one pool
        $scope.$watch('selectedCount', function (count) {
            _.map($scope.dataModel.displayList, function (storagePool) {
                storagePool.disabledCheckBox = !(count === 0 || (count === 1 && storagePool.storagePoolId === $scope.dataModel.getSelectedItems()[0].storagePoolId));
            });
        });

    });
