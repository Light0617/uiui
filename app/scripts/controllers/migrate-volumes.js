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

        var GET_VOLUMES_PATH = 'volumes';

        var updateResultTotalCounts = function(result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = result.resources;
            $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        var getVolumes = function(storageSystemId) {
            paginationService.get(null, GET_VOLUMES_PATH, objectTransformService.transformVolume, true, storageSystemId).then(function (result) {
                paginationService.clearQuery();

                //add for button
                var noAvailableArray = false;

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
                    busy: false,
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
                                paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function (result) {
                                    updateResultTotalCounts(result);
                                });
                            });
                        }
                    }
                };

                // Todo: add 'selectPort'
                angular.extend(dataModel, viewModelService.newWizardViewModel(['selectVolumes', 'selectPool']));


                // Todo: Add for footer button
                dataModel.selectVolumesModel = {
                    noAvailableArray: noAvailableArray,
                    confirmTitle: synchronousTranslateService.translate('storage-volume-migrate-confirmation'),
                    confirmMessage: synchronousTranslateService.translate('storage-volume-migrate-zero-selected'),
                    canGoNext: function () {
                        return _.some(dataModel.displayList, 'selected');
                    },

                    //TODO: next step of confirmation needs further discussion
                    // showPopUpOnAnyAttachedVolume: function () {
                    //     if(dataModel.selectVolumesModel.areAllSelectedVolumesUnattached()) {
                    //         return true;
                    //     } else {
                    //         var modelInstance = $modal.open({
                    //             templateUrl: 'views/templates/attach-volume-confirmation-modal.html',
                    //             windowClass: 'modal fade confirmation',
                    //             backdropClass: 'modal-backdrop',
                    //             controller: function ($scope) {
                    //                 $scope.cancel = function () {
                    //                     modelInstance.dismiss('cancel');
                    //                 };
                    //
                    //                 $scope.ok = function() {
                    //                     $timeout(function () {
                    //                         dataModel.attachModel.selectedVolumes = _.where(dataModel.displayList, 'selected');
                    //                         _.forEach(dataModel.attachModel.selectedVolumes, function(volume) {
                    //                             volume.lun = null;
                    //                             volume.decimalNumberRegexp = /^[^.]+$/;
                    //                             volume.hasDuplicatedLun = false;
                    //                             volume.validationTooltip = VALID_TOOLTIP;
                    //                         });
                    //                     });
                    //                     dataModel.goNext();
                    //                     modelInstance.close(true);
                    //                 };
                    //
                    //                 modelInstance.result.finally(function() {
                    //                     $scope.cancel();
                    //                 });
                    //             }
                    //         });
                    //     }
                    // },

                    //TODO: next step of confirmation needs further discussion
                    // areAllSelectedVolumesUnattached: function() {
                    //     var flags = [];
                    //     _.forEach(dataModel.getSelectedItems(), function (item) {
                    //         flags.push(item.isUnattached());
                    //     });
                    //     return flags.areAllItemsTrue();
                    // },

                    next: function () {
                        //TODO: next step of confirmation needs further discussion
                        // if(!dataModel.selectVolumesModel.showPopUpOnAnyAttachedVolume()) {
                        //     return;
                        // }
                        if (dataModel.selectVolumesModel.canGoNext && dataModel.selectVolumesModel.canGoNext()) {
                            $timeout(function () {
                                dataModel.attachModel.selectedVolumes = _.where(dataModel.displayList, 'selected');
                                _.forEach(dataModel.attachModel.selectedVolumes, function (volume) {
                                    volume.lun = null;
                                    volume.decimalNumberRegexp = /^[^.]+$/;
                                    volume.hasDuplicatedLun = false;
                                    volume.validationTooltip = VALID_TOOLTIP;
                                });
                            });
                            dataModel.goNext();
                        }
                    },
                    validation: true,
                    itemSelected: false
                };




                $scope.filterModel = {
                    $replicationRawTypes: replicationService.rawTypes,
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
                        }
                    },
                    fetchPreviousVolumeType: function (previousVolumeType) {
                        $scope.filterModel.filter.previousVolumeType = previousVolumeType;
                    },
                    arrayType: (new paginationService.SearchType()).ARRAY,
                    filterQuery: function (key, value, type, arrayClearKey) {
                        gadVolumeTypeSearchService.filterQuery(key, value, type, arrayClearKey, $scope.filterModel);
                        paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function (result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    sliderQuery: function (key, start, end, unit) {
                        paginationService.setSliderSearch(key, start, end, unit);
                        paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function (result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    searchQuery: function (value) {
                        var queryObjects = [];
                        queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().STRING, value));
                        queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                        paginationService.setTextSearch(queryObjects);
                        paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function (result) {
                            updateResultTotalCounts(result);
                        });
                    }
                };

                inventorySettingsService.setVolumesGridSettings(dataModel);

                dataModel.cachedList = result.resources;
                dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                dataModel.getResources = function () {
                    return paginationService.get($scope.dataModel.nextToken, GET_VOLUMES_PATH, objectTransformService.transformVolume, false, storageSystemId);
                };
                $scope.dataModel = dataModel;

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');
            });
        };

        paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result) {
            $scope.dataModel.storageSystems = result;
            $scope.dataModel.storageSystems.push({storageSystemId: -1, storageSystemName: 'External'});
            $scope.dataModel.selectedSource = _.first($scope.dataModel.storageSystems);
            $scope.dataModel.selectedTarget = _.last($scope.dataModel.storageSystems);
            var storageSystemId = $scope.dataModel.selectedSource.storageSystemId;
            getVolumes(storageSystemId);
        });


        $scope.$watch('dataModel.selectedSource', function(newValue) {
            if(newValue) {
                getVolumes(newValue.storageSystemId);
            }
        });
    });
