'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePoolCtrl
 * @description
 * # StoragePoolCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StoragePoolCtrl', function ($scope, $routeParams, $window, orchestratorService, objectTransformService,
                                             diskSizeService, paginationService, ShareDataService, 
                                             inventorySettingsService, scrollDataSourceBuilderServiceNew,
                                             storageSystemVolumeService, $location, queryService, $timeout, 
                                             synchronousTranslateService, commonConverterService) {
        var storageSystemId = $routeParams.storageSystemId;
        var storagePoolId = $routeParams.storagePoolId;
        var GET_VOLUMES_WITH_POOL_ID_FILTER_PATH = 'volumes?q=poolId:'+storagePoolId;
        var GET_VOLUMES_PATH = 'volumes';
        ShareDataService.showProvisioningStatus = true;
        ShareDataService.showPoolBreadCrumb = true;

        var volumeUnprotectActions = function (selectedVolume) {
            ShareDataService.volumeListForUnprotect = selectedVolume;

            $location.path(['storage-systems', storageSystemId, 'storage-pools', storagePoolId, 'volumes', 'unprotect'].join('/'));
        };

        var volumeRestoreAction = function (action, selectedVolumes) {

            var volumeId = 0;
            if (selectedVolumes && selectedVolumes.length > 0) {
                volumeId = selectedVolumes[0].volumeId;
            }

            storageSystemVolumeService.getVolumePairsAsPVol(null, volumeId, storageSystemId).then(function (result) {

                ShareDataService.SVolsList = _.filter(result.resources, function(SVol){ return SVol.primaryVolume && SVol.secondaryVolume; });
                ShareDataService.restorePrimaryVolumeId = volumeId;
                ShareDataService.restorePrimaryVolumeToken = result.nextToken;

                _.forEach(ShareDataService.SVolsList, function (volume) {
                    volume.selected = false;
                });
                $location.path(['/storage-systems/', storageSystemId,  '/storage-pools/', storagePoolId,
                    '/volumes/volume-actions-restore-selection'].join(''));
            });
        };

        paginationService.get(null, GET_VOLUMES_WITH_POOL_ID_FILTER_PATH, objectTransformService.transformVolume, true, storageSystemId).then(function (result) {
            paginationService.clearQuery();
            var dataModel = {
                view: 'tile',
                storagePoolId: storagePoolId,
                context: 'poolDetails',
                storageSystemId: storageSystemId,
                nextToken: result.nextToken,
                total: result.total,
                currentPageCount: 0,
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
                            paginationService.getQuery(GET_VOLUMES_WITH_POOL_ID_FILTER_PATH, objectTransformService.transformVolume, storageSystemId).then(function(result) {
                                updateResultTotalCounts(result);
                            });
                        });
                    }
                }
            };

            $scope.filterModel = {
                filter: {
                    freeText: '',
                    provisioningStatus: '',
                    replicationType: [],
                    protectionStatusList: [],
                    snapshotex: false,
                    snapshotfc: false,
                    snapshot: false,
                    gad: false,
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
                arrayType: (new paginationService.SearchType()).ARRAY,
                filterQuery: function (key, value, type, arrayClearKey) {
                    var queryObject;
                    // This is used when you need to use 1 click/button to query more than 1 possibilities on 1 attribute.
                    if (value instanceof Array && arrayClearKey instanceof Array) {
                        for (var queryParameterIndex = 0 ; queryParameterIndex < value.length; ++queryParameterIndex) {
                            if ($scope.filterModel.filter.gadActivePrimary && key === 'gadSummary.volumeType' &&
                                arrayClearKey[queryParameterIndex] === 'Active-Primary') {
                                continue;
                            }
                            if ($scope.filterModel.filter.gadActiveSecondary && key === 'gadSummary.volumeType' &&
                                arrayClearKey[queryParameterIndex] === 'Active-Secondary') {
                                continue;
                            }

                            queryObject =
                                new paginationService.QueryObject(key, type, value[queryParameterIndex], arrayClearKey[queryParameterIndex]);
                            paginationService.setFilterSearch(queryObject);
                            paginationService.addSearchParameter(new paginationService.QueryObject('poolId', new paginationService.SearchType().INT, storagePoolId));
                        }
                    } else {
                        if (!($scope.filterModel.filter.gad && key === 'gadSummary.volumeType' &&
                            (arrayClearKey === 'Active-Primary' || arrayClearKey === 'Active-Secondary'))) {
                            queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                            paginationService.setFilterSearch(queryObject);
                            paginationService.addSearchParameter(new paginationService.QueryObject('poolId', new paginationService.SearchType().INT, storagePoolId));
                        }
                    }
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                sliderQuery: function(key, start, end, unit) {
                    paginationService.setSliderSearch(key, start, end, unit);
                    paginationService.addSearchParameter(new paginationService.QueryObject('poolId', new paginationService.SearchType().INT, storagePoolId));
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().INT, value));
                    queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.addSearchParameter(new paginationService.QueryObject('poolId', new paginationService.SearchType().INT, storagePoolId));
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                }
            };

            inventorySettingsService.setVolumesGridSettings(dataModel);

            var actions = [
                {
                    icon: 'icon-delete',
                    tooltip: 'action-tooltip-delete',
                    type: 'confirm',

                    confirmTitle: 'storage-volume-delete-confirmation',
                    confirmMessage: 'storage-volume-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    onClick: function () {
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            item.actions.delete.onClick(orchestratorService, false);
                        });
                    }
                },
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected();
                    },
                    onClick: function () {
                        var item = _.first(dataModel.getSelectedItems());
                        item.actions.edit.onClick();

                    }
                },
                {
                    icon: 'icon-attach-volume',
                    tooltip: 'action-tooltip-attach-volumes',
                    type: 'link',
                    onClick: function () {
                        ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                        $location.path(['storage-systems', storageSystemId, 'storage-pools', storagePoolId, 'attach-volumes'].join(
                            '/'));
                    },
                    enabled: function () {
                        return dataModel.anySelected();
                    }
                },
                {
                    icon: 'icon-detach-volume',
                    tooltip: 'storage-volume-detach',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && _.some(dataModel.getSelectedItems(),
                                function (vol) {
                                    return vol.isAttached();
                                });
                    },
                    onClick: function () {
                        var item = _.first(dataModel.getSelectedItems());
                        item.actions.detach.onClick();
                    }
                },
                {
                    icon: 'icon-data-protection',
                    tooltip: 'action-tooltip-protect-volumes',
                    type: 'link',
                    onClick: function () {
                        ShareDataService.volumesList = dataModel.getSelectedItems();
                        $location.path(['storage-systems', storageSystemId, 'storage-pools', storagePoolId,
                            'volumes/protect'
                        ].join('/'));
                    },
                    enabled: function () {
                        return dataModel.anySelected();
                    }
                },
                {
                    icon: 'icon-remove-volume',
                    tooltip: 'action-tooltip-unprotect-volumes',
                    type: 'link',
                    onClick: function () {
                        volumeUnprotectActions(dataModel.getSelectedItems());
                    },
                    enabled: function () {
                        return dataModel.onlyOneSelected() && !_.some(dataModel.getSelectedItems(),
                                function (vol) {
                                    return vol.isUnprotected();
                                });
                    }
                },
                {
                    icon: 'icon-refresh',
                    tooltip: 'action-tooltip-restore-volumes',
                    type: 'link',
                    onClick: function () {
                        volumeRestoreAction('restore', dataModel.getSelectedItems());
                    },
                    enabled: function () {
                        return dataModel.onlyOneSelected() && !_.some(dataModel.getSelectedItems(),
                                function (vol) {
                                    return vol.isUnprotected();
                                });
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

            dataModel.cachedList = result.resources;
            dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

            dataModel.getResources = function(){
                return paginationService.get($scope.dataModel.nextToken, GET_VOLUMES_WITH_POOL_ID_FILTER_PATH, objectTransformService.transformVolume, false, storageSystemId);
            };
            $scope.dataModel = dataModel;

            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');
        });

        var updateResultTotalCounts = function(result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = result.resources;
            $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        orchestratorService.storagePool(storageSystemId, storagePoolId).then(function (result) {

            var summaryModel = objectTransformService.transformToPoolSummaryModel(result);
            summaryModel.title = 'Storage pool ' + storagePoolId;
            summaryModel.noBreakdown = true;
            $scope.summaryModel = summaryModel;

            var fmdDc2CompModel = objectTransformService.transformToPoolFMCDC2CompressionModel(result);
            var logicalCapacityDisplaySize = diskSizeService.getDisplaySize(result.logicalCapacityInBytes);
            var usedCapacityDisplaySize = diskSizeService.getDisplaySize(result.usedLogicalCapacityInBytes);

            result.arrayDataVisualizationModel = fmdDc2CompModel;
            result.orchestratorService = orchestratorService;
            result.compressedParityGroups = _.filter(result.parityGroups, function(pg) { return pg.compression; });
            result.actionsList = _.map(result.actions);
            result.utilizationThreshold1 = addPercentageSign(result.utilizationThreshold1);
            result.utilizationThreshold2 = addPercentageSign(result.utilizationThreshold2);
            result.subscriptionLimit.value = addPercentageSign(result.subscriptionLimit.value);
            result.logicalCapacityInBytes = getSizeDisplayText(logicalCapacityDisplaySize);
            result.usedLogicalCapacityInBytes = getSizeDisplayText(usedCapacityDisplaySize);
            result.availableLogicalCapacityInBytes = getSizeDisplayText(diskSizeService.getDisplaySize(result.availableLogicalCapacityInBytes));
            result.activeFlashEnabled = commonConverterService.convertBooleanToString(result.activeFlashEnabled);
            result.nasBoot = commonConverterService.convertBooleanToString(result.nasBoot);
            result.fmcCapacityData = transformToPoolSummaryModel(logicalCapacityDisplaySize, usedCapacityDisplaySize);


            result.compressionRatioProportion = transformToCompressRatio(result.compressionDetails.compressionRate);
            result.deduplicationRatioProportion = transformToCompressRatio(result.compressionDetails.deduplicationRate);
            result.savingsPercentageBar = transformToUsageBarData(result.compressionDetails.savingsPercentage);

            result.fmcExpansionRatio = transformToExpansionRatio(result.fmcCompressionDetails.expansionRate);
            result.fmcCompressionRatio = transformToCompressRatio(result.fmcCompressionDetails.compressionRate);
            result.fmcSavingsPercentageBar = transformToUsageBarData(result.fmcCompressionDetails.savingsPercentage);

            result.showCompressionDetails = function () {
                if (result.fmcCompressed === 'YES') {
                    return true;
                } else if (result.deduplicationEnabled === true) {
                    return true;
                } else if (result.compressionDetails.compressionRate === 1 &&
                    result.compressionDetails.savingsPercentage === 0) {
                    return false;
                } else {
                    return true;
                }
            };
            result.showFmcDetails = function() {
                if (result.fmcCompressed === 'YES') {
                    return true;
                } else {
                    return false;
                }
            };
            
            $scope.poolDataModel = result;
        });

        function addPercentageSign (value) {
            return value + '%';
        }

        function getSizeDisplayText (object) {
            return object.size + ' ' + object.unit;
        }

        function transformToCompressRatio(rate) {
            return {
                radius: 75,
                numerator: 1,
                denominator: rate,
                numeratorColor: '#265CB3',
                denominatorColor: '#66A2FF',
            };
        }

        function transformToExpansionRatio(rate) {
            return {
                radius: 75,
                denominator: 1,
                numerator: rate,
                numeratorColor: '#265CB3',
                denominatorColor: '#66A2FF',
            };
        }

        function transformToUsageBarData(percentage) {
            return  {
                colorClass: 'normal',
                usagePercentage: percentage,
            };
        }

        function  transformToPoolSummaryModel (totalCapacity, usedCapacity) {
            var percentage = (usedCapacity.size / totalCapacity.size * 100.0).toFixed(1);
            return {
                item: {
                    total: {
                        capacity: {
                            size: totalCapacity.size,
                            unit: totalCapacity.unit
                        },
                        label: 'Total',
                    },
                    used: {
                        capacity: {
                            size: usedCapacity.size,
                            unit: usedCapacity.unit
                        },
                        label: 'Used'
                    },
                    item: [
                        {
                            percentage: percentage,
                            label: 'Used%',
                            color: '#7BC242'
                        },
                        {
                            percentage: 100,
                            color: '#294A0E'
                        }],
                }
            };
        }
    });
