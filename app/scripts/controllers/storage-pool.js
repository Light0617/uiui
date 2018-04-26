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
                                             synchronousTranslateService, commonConverterService, $modal,
                                             replicationService, resourceTrackerService, gadVolumeTypeSearchService,
                                             migrationTaskService, $q, constantService, virtualizeVolumeService, utilService) {
        var storageSystemId = $routeParams.storageSystemId;
        var storagePoolId = $routeParams.storagePoolId;
        var GET_VOLUMES_WITH_POOL_ID_FILTER_PATH = 'volumes?q=poolId:'+storagePoolId;
        var GET_VOLUMES_PATH = 'volumes';
        var GET_EXTERNAL_VOLUMES_WITH_POOL_ID_PATH = 'external-volumes?q=poolId:'+storagePoolId;
        var GET_EXTERNAL_VOLUMES_PATH = 'external-volumes';
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

        var getVolume = function(poolResult){
            var PATH;
            var transform;
            var FILTER_PATH;
            var ddmEnabled = poolResult.ddmEnabled;
            var actions = [];
            var gridSettings;
            var dataModel = {};

            var hasGadVolume = function(selectedVolumes)  {
                return _.find(selectedVolumes, function(volume) {return volume.isGadVolume();}) !== undefined;
            };

            var hasShredding = function (selectedVolumes) {
                return _.some(selectedVolumes, function (vol) { return vol.isShredding(); });
            };

            var enableToShred = function (volume) {
                return volume.isNormal() || volume.status === constantService.volumeStatus.BLOCKED;
            };

            var detachFromTargetStorageDialogSettings = function () {
                var dialogSettings = {
                    id: 'detachFromTargetStorageConfirmation',
                    title: 'storage-volume-detach-from-target',
                    content: 'storage-volume-detach-from-target-content',
                    disableRadioButton: true,
                    itemAttributes: [],
                    itemAttribute: {}
                };

                return dialogSettings;
            };

            var getStorageSystems = function () {
                return paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result) {
                    result = _.filter(result, function (r) {
                        return r.storageSystemId !== storageSystemId;
                    });
                    $scope.dataModel.storageSystems = result;

                    if(result.length > 0) {
                        return $q.resolve(result);
                    }else{
                        return $q.reject('storage-system-not-found-error');
                    }
                });
            };

            if(ddmEnabled){
                PATH =GET_EXTERNAL_VOLUMES_WITH_POOL_ID_PATH;
                transform = objectTransformService.transformExternalVolume;
                FILTER_PATH = GET_EXTERNAL_VOLUMES_PATH;
                gridSettings = inventorySettingsService.setExternalVolumeGridSettings;
                actions = [
                    {
                        icon: 'icon-detach-volume',
                        tooltip: 'storage-volume-detach',
                        type: 'link',
                        enabled: function () {
                            return dataModel.onlyOneSelected() && _.some(dataModel.getSelectedItems(),
                                function (vol) {
                                    return vol.isAttached();
                                }) && !hasGadVolume(dataModel.getSelectedItems());
                        },
                        onClick: function () {
                            var item = _.first(dataModel.getSelectedItems());
                            item.actions.detach.onClick();
                        }
                    },
                    {
                        icon: 'icon-migrate-volume',
                        tooltip: 'action-tooltip-migrate-volumes',
                        type: 'link',
                        enabled: function () {
                            return dataModel.volumeMigrationAvailable &&
                                dataModel.getSelectedCount() > 0 && dataModel.getSelectedCount() <= 300 &&
                                migrationTaskService.isAllMigrationAvailable(dataModel.getSelectedItems());
                        },
                        onClick: function () {
                            ShareDataService.selectedMigrateVolumes = dataModel.getSelectedItems();
                            $location.path(['storage-systems', storageSystemId, 'migrate-volumes'].join('/'));
                        }

                    }
                ];
            }else{
                PATH = GET_VOLUMES_WITH_POOL_ID_FILTER_PATH;
                transform = objectTransformService.transformVolume;
                FILTER_PATH = GET_VOLUMES_PATH;
                gridSettings = inventorySettingsService.setVolumesGridSettings;
                actions = [
                    {
                        icon: 'icon-delete',
                        tooltip: 'action-tooltip-delete',
                        type: 'confirm',

                        confirmTitle: 'storage-volume-delete-confirmation',
                        confirmMessage: 'storage-volume-delete-selected-content',
                        enabled: function () {
                            return dataModel.anySelected() && !hasGadVolume(dataModel.getSelectedItems()) &&
                                !hasShredding(dataModel.getSelectedItems());
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
                            return dataModel.onlyOneSelected() && !hasGadVolume(dataModel.getSelectedItems()) &&
                                !hasShredding(dataModel.getSelectedItems());
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
                        enabled: function () {
                            return dataModel.anySelected() && !hasGadVolume(dataModel.getSelectedItems());
                        },
                        onClick: function () {
                            var flags = [];
                            _.forEach(dataModel.getSelectedItems(), function (item) {
                                flags.push(item.isUnattached());
                            });
                            if (areAllItemsTrue(flags)) {
                                ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                                $location.path(['storage-systems', storageSystemId, 'storage-pools', storagePoolId, 'attach-volumes'].join(
                                    '/'));
                            } else {
                                var modelInstance = $modal.open({
                                    templateUrl: 'views/templates/attach-volume-confirmation-modal.html',
                                    windowClass: 'modal fade confirmation',
                                    backdropClass: 'modal-backdrop',
                                    controller: function ($scope) {
                                        $scope.cancel = function () {
                                            modelInstance.dismiss('cancel');
                                        };

                                        $scope.ok = function () {
                                            ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                                            $location.path(['storage-systems', storageSystemId, 'storage-pools', storagePoolId, 'attach-volumes'].join(
                                                '/'));
                                            modelInstance.close(true);
                                        };

                                        modelInstance.result.finally(function () {
                                            $scope.cancel();
                                        });
                                    }
                                });
                            }
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
                                }) && !hasGadVolume(dataModel.getSelectedItems());
                        },
                        onClick: function () {
                            var item = _.first(dataModel.getSelectedItems());
                            item.actions.detach.onClick();
                        }
                    },
                    {
                        type: 'spacer'
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
                            return dataModel.anySelected() && _.all(dataModel.getSelectedItems(),
                                function (vol) {
                                    return vol.isAttached() && !vol.isShredding();
                                });
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
                    },
                    {
                        type: 'spacer'
                    },
                    // Attach to storage
                    {
                        icon: 'icon-attach-vol-to-storage',
                        tooltip: 'action-tooltip-attach-to-storage',
                        type: 'link',
                        enabled: function () {
                            return dataModel.anySelected();
                        },
                        onClick: function () {
                            virtualizeVolumeService.invokeOpenAttachToStorage(dataModel.getSelectedItems());
                        }
                    },
                    {
                        icon: 'icon-migrate-volume',
                        tooltip: 'action-tooltip-migrate-volumes',
                        type: 'link',
                        enabled: function () {
                            return dataModel.volumeMigrationAvailable &&
                                dataModel.getSelectedCount() > 0 && dataModel.getSelectedCount() <= 300 &&
                                migrationTaskService.isAllMigrationAvailable(dataModel.getSelectedItems());
                        },
                        onClick: function () {
                            ShareDataService.selectedMigrateVolumes = dataModel.getSelectedItems();
                            $location.path(['storage-systems', storageSystemId, 'migrate-volumes'].join('/'));
                        }
                    },
                    {
                        icon: 'icon-detach-vol-to-storage',
                        tooltip: 'storage-volume-detach-from-target',
                        type: 'confirmation-modal',
                        dialogSettings: detachFromTargetStorageDialogSettings(),
                        enabled: function () {
                            return dataModel.anySelected();
                        },
                        confirmClick: function () {
                            $('#' + this.dialogSettings.id).modal('hide');
                            var targetStorageSystemId = this.dialogSettings.itemAttribute.value;
                            if(!utilService.isNullOrUndef(targetStorageSystemId)) {
                                _.forEach(dataModel.getSelectedItems(), function (item) {
                                    var unprevirtualizePayload  = {
                                        targetStorageSystemId : targetStorageSystemId
                                    };
                                    orchestratorService.unprevirtualize(storageSystemId, item.volumeId, unprevirtualizePayload);
                                });
                            }
                        },
                        onClick: function () {
                            var dialogSettings = this.dialogSettings;

                            getStorageSystems().then(function () {
                                _.each($scope.dataModel.storageSystems, function (storageSystem) {
                                    dialogSettings.itemAttributes.push(storageSystem.storageSystemId);
                                });
                                dialogSettings.itemAttribute = {
                                    value: dialogSettings.itemAttributes[0]
                                };
                            }).catch(function(e){
                                dialogSettings.content = e;
                            });
                        }
                    },
                    {
                        icon: 'icon-shred-volume',
                        tooltip: 'shred-volumes',
                        type: 'link',
                        enabled: function(){
                            return dataModel.getSelectedCount() > 0 && dataModel.getSelectedCount() <= 300 &&
                                !_.some(dataModel.getSelectedItems(), function (vol) {
                                    return !vol.isUnattached() || !enableToShred(vol)  ||
                                        vol.capacitySavingType !== 'No' || vol.isSnapshotPair();
                                });
                        },
                        onClick: function () {
                            ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                            $location.path(['storage-systems', storageSystemId, 'volumes', 'shred-volumes'].join('/'));
                        }
                    }
                ];
            }

            paginationService.get(null, PATH, transform, true, storageSystemId).then(function (result) {
                paginationService.clearQuery();
                dataModel = {
                    view: 'tile',
                    storagePoolId: storagePoolId,
                    context: 'poolDetails',
                    storageSystemId: storageSystemId,
                    nextToken: result.nextToken,
                    total: result.total,
                    currentPageCount: 0,
                    busy: false,
                    ddmEnabled: ddmEnabled,
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
                                paginationService.getQuery(PATH, transform, storageSystemId).then(function(result) {
                                    updateResultTotalCounts(result);
                                });
                            });
                        }
                    }
                };

                dataModel.addAction = (poolResult.type === 'HTI' || poolResult.label.indexOf('HSA-reserved-') === 0) && (!ddmEnabled);

                migrationTaskService.checkLicense(storageSystemId).then(function (result) {
                    dataModel.volumeMigrationAvailable = result;
                });

                $scope.filterModel = {
                    ddmEnabled: $scope.poolDataModel.ddmEnabled,
                    $replicationRawTypes: replicationService.rawTypes,
                    filter: {
                        freeText: '',
                        provisioningStatus: '',
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
                    },
                    arrayType: (new paginationService.SearchType()).ARRAY,
                    filterQuery: function (key, value, type, arrayClearKey) {
                        gadVolumeTypeSearchService.filterQuery(key, value, type, arrayClearKey, $scope.filterModel);
                        paginationService.addSearchParameter(new paginationService.QueryObject('poolId', new paginationService.SearchType().INT, storagePoolId));
                        paginationService.getQuery(FILTER_PATH, transform, storageSystemId).then(function(result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    migrationFilterQuery: function (type, isManaged) {
                        migrationTaskService.volumeMigrationTypeFilter(type, isManaged, $scope.filterModel.filter.migrationType);
                        paginationService.addSearchParameter(new paginationService.QueryObject('poolId', new paginationService.SearchType().INT, storagePoolId));
                        paginationService.getQuery(FILTER_PATH, transform, storageSystemId).then(function(result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    sliderQuery: function(key, start, end, unit) {
                        paginationService.setSliderSearch(key, start, end, unit);
                        paginationService.addSearchParameter(new paginationService.QueryObject('poolId', new paginationService.SearchType().INT, storagePoolId));
                        paginationService.getQuery(FILTER_PATH, transform, storageSystemId).then(function(result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    searchQuery: function (value) {
                        var queryObjects = [];
                        queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().INT, value));
                        queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                        paginationService.setTextSearch(queryObjects);
                        paginationService.addSearchParameter(new paginationService.QueryObject('poolId', new paginationService.SearchType().INT, storagePoolId));
                        paginationService.getQuery(FILTER_PATH, transform, storageSystemId).then(function(result) {
                            updateResultTotalCounts(result);
                        });
                    }
                };

                dataModel.getActions = function () {
                    return actions;
                };

                dataModel.cachedList = result.resources;
                dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                dataModel.getResources = function(){
                    return paginationService.get($scope.dataModel.nextToken, PATH, transform, false, storageSystemId);
                };
                $scope.dataModel = dataModel;

                gridSettings(dataModel);

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');
            });
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

        var getStorageSystem = function(){
            return orchestratorService.storageSystem(storageSystemId).then(function (result) {
                $scope.storageSystemDataModel = result;
                return $q.resolve();
            });
        };

        var getPool = function(){
             return orchestratorService.storagePool(storageSystemId, storagePoolId).then(function (result) {

                    var summaryModel = objectTransformService.transformToPoolSummaryModel(result);
                    summaryModel.title = 'Storage pool ' + storagePoolId;
                    summaryModel.noBreakdown = true;
                    $scope.summaryModel = summaryModel;

                    var logicalCapacityDisplaySize = diskSizeService.getDisplaySize(result.logicalCapacityInBytes);
                    var usedCapacityDisplaySize = diskSizeService.getDisplaySize(result.usedLogicalCapacityInBytes);

                    result.orchestratorService = orchestratorService;
                    result.compressedParityGroups = _.filter(result.parityGroups, function(pg) { return pg.compression; });
                    result.actions = _.map({
                        'delete': {
                            icon: 'icon-delete',
                            type: 'confirm',
                            confirmTitle: 'storage-pool-delete-one-confirmation',
                            confirmMessage: 'storage-pool-delete-current-content',
                            enabled: function () {
                                return result.label.indexOf('HSA-reserved') === -1;
                            },
                            onClick: function (orchestratorService) {

                                // Build reserved resources
                                var reservedResourcesList = [];
                                var poolIds = [storagePoolId];
                                reservedResourcesList.push(storagePoolId + '=' + resourceTrackerService.storagePool());

                                // Show popup if resource is present in resource tracker else submit
                                resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                                    'Delete Pool Confirmation', storageSystemId, poolIds, null, orchestratorService.deleteStoragePool);

                            }
                        },
                        'edit': {
                            icon: 'icon-edit',
                            type: 'link',
                            enabled: function () {
                                return result.label.indexOf('HSA-reserved') === -1 && !result.ddmEnabled;
                            },
                            onClick: function () {
                                $location.path(['storage-systems', storageSystemId,
                                    'storage-pools', storagePoolId, 'update'
                                ].join('/'));
                            }
                        }
                    });
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
                    result.deduplicationSystemDataCapacityInBytes = getSizeDisplayText(
                        diskSizeService.getDisplaySize(result.deduplicationSystemDataCapacityInBytes));
                    result.savingsPercentageBar = transformToUsageBarData(result.compressionDetails.savingsPercentage);

                    result.fmcExpansionRatio = transformToExpansionRatio(result.fmcCompressionDetails.expansionRate);
                    result.fmcCompressionRatio = transformToCompressRatio(result.fmcCompressionDetails.compressionRate);
                    result.fmcSavingsPercentageBar = transformToUsageBarData(result.fmcCompressionDetails.savingsPercentage);

                    result.showCompressionDetails = function () {
                        if (result.deduplicationEnabled === true) {
                            return true;
                        } else if (result.compressionDetails.compressionRate === 1 &&
                            (result.compressionDetails.savingsPercentage === 0 || result.compressionDetails.savingsPercentage === null)) {
                            return false;
                        }
                        return true;
                    };
                    result.showFmcDetails = function() {
                        if (result.fmcCompressed === 'YES' || result.fmcCompressed === 'PARTIAL') {
                            return true;
                        } else {
                            return false;
                        }
                    };

                    result.dispDeduplicationEnabled = commonConverterService.convertBooleanToString(result.deduplicationEnabled);

                    $scope.poolDataModel = result;


                    return $q.resolve(result);
             }).catch(function(e){
                 return $q.reject(e);
             });
        };

        getStorageSystem().then(getPool).then(
            function(result) {
                getVolume(result);
            }
        ).catch(function(e){
            console.log(e);
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
            var percentage = (usedCapacity.value / totalCapacity.value * 100.0).toFixed(1);
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

        function areAllItemsTrue(flags){
            return _.find(flags, function(flag){
                return flag === false;
            }) === undefined;
        }
    });
