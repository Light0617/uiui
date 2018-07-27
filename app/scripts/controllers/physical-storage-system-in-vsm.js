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
        resourceTrackerService, volumeService, virtualizeVolumeService, utilService, $modal, $q, storageSystemVolumeService
    ) {
        var physicalStorageSystemId = $routeParams.physicalStorageSystemId;
        var virtualStorageMachineId = $routeParams.virtualStorageMachineId;
        var virtualStorageMachineIdList = virtualStorageMachineId.split('-');
        var storageSystemId = virtualStorageMachineIdList[0];
        var GET_VOLUMES_PATH = 'volumes?q=virtualStorageMachineInformation.virtualStorageMachineId:'+virtualStorageMachineId;

        var title = 'Physical Storage System '+ physicalStorageSystemId + ' in ' + virtualStorageMachineId;

        var initModels = function() {
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


        var getVolumeInventory = function(){
            return paginationService.get(null, GET_VOLUMES_PATH, objectTransformService.transformVolume, true,
                physicalStorageSystemId).then(function (result) {
                paginationService.clearQuery();
                var dataModel = $scope.dataModel;

                $scope.filterModel = _.extend($scope.filterModel, {
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

                inventorySettingsService.setVolumesGridSettings(dataModel);

                var actions = [
                    {
                        icon: 'icon-delete',
                        tooltip: 'action-tooltip-delete',
                        type: 'confirm',

                        confirmTitle: 'storage-volume-delete-confirmation',
                        confirmMessage: 'storage-volume-delete-selected-content',
                        enabled: function () {
                            return dataModel.anySelected() && !volumeService.hasGadVolume(dataModel.getSelectedItems()) &&
                                !volumeService.hasShredding(dataModel.getSelectedItems());
                        },
                        onClick: function () {
                            // Build reserved resources
                            var reservedResourcesList = [];
                            var volIds = [];
                            _.forEach(dataModel.getSelectedItems(), function (item) {
                                reservedResourcesList.push(item.volumeId + '=' + resourceTrackerService.volume());
                                volIds.push(item.volumeId);
                            });

                            // Show popup if resource is present in resource tracker else submit
                            resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId,
                                resourceTrackerService.storageSystem(), 'Delete Volumes Confirmation', storageSystemId,
                                volIds, null, orchestratorService.deleteVolume);

                        }
                    },
                    {
                        icon: 'icon-edit',
                        tooltip: 'action-tooltip-edit',
                        type: 'link',
                        enabled: function () {
                            return dataModel.onlyOneSelected() &&
                                !volumeService.hasGadVolume(dataModel.getSelectedItems()) &&
                                !volumeService.hasShredding(dataModel.getSelectedItems());
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
                            var flags = [];
                            _.forEach(dataModel.getSelectedItems(), function (item) {
                                flags.push(item.isUnattached());
                            });
                            if (flags.areAllItemsTrue()) {
                                ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                                $location.path(['storage-systems', storageSystemId, 'attach-volumes'].join('/'));
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
                                            $location.path(['storage-systems', storageSystemId, 'attach-volumes'].join('/'));
                                            modelInstance.close(true);
                                        };

                                        modelInstance.result.finally(function () {
                                            $scope.cancel();
                                        });
                                    }
                                });
                            }
                        },
                        enabled: function () {
                            return dataModel.anySelected() && !volumeService.hasGadVolume(dataModel.getSelectedItems());
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
                                }) && !volumeService.hasGadVolume(dataModel.getSelectedItems());
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
                            $location.path(['storage-systems', storageSystemId,
                                'volumes/protect'].join('/'));
                        },
                        enabled: function () {
                            return dataModel.anySelected() &&
                                _.all(dataModel.getSelectedItems(),
                                    function (vol) {
                                        return (vol.isAttached() || vol.isUnmanaged()) && !vol.isShredding();
                                    });
                        }
                    },
                    {
                        icon: 'icon-remove-volume',
                        tooltip: 'action-tooltip-unprotect-volumes',
                        type: 'link',
                        onClick: function () {
                            volumeService.volumeUnprotectActions(dataModel.getSelectedItems(), storageSystemId);
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
                            volumeService.volumeRestoreAction('restore', dataModel.getSelectedItems(),
                                storageSystemId, storageSystemVolumeService);
                        },
                        enabled: function () {
                            return dataModel.onlyOneSelected() && _.some(dataModel.getSelectedItems(),
                                function (vol) {
                                    return volumeService.restorable(vol);
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
                        dialogSettings: volumeService.detachFromTargetStorageDialogSettings(),
                        enabled: function () {
                            return dataModel.anySelected();
                        },
                        confirmClick: function () {
                            $('#' + this.dialogSettings.id).modal('hide');

                            var targetStorageSystemId = this.dialogSettings.itemAttribute.value;

                            if(!utilService.isNullOrUndef(targetStorageSystemId)){
                                _.forEach(dataModel.getSelectedItems(), function (item) {
                                    var unprevirtualizePayload  = {
                                        targetStorageSystemId : targetStorageSystemId
                                    };
                                    orchestratorService.unprevirtualize(storageSystemId, item.volumeId, unprevirtualizePayload);
                                });
                            }
                        },
                        onClick: function () {
                            this.dialogSettings.itemAttributes = [];

                            var dialogSettings = this.dialogSettings;

                            volumeService.getStorageSystems(paginationService, orchestratorService, storageSystemId)
                                .then(function (result) {
                                _.each(result, function (storageSystem) {
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
                    //Shredding
                    {
                        icon: 'icon-shred-volume',
                        tooltip: 'shred-volumes',
                        type: 'link',
                        enabled: function () {
                            return dataModel.getSelectedCount() > 0 && dataModel.getSelectedCount() <= 300 &&
                                !_.some(dataModel.getSelectedItems(), function (vol) {
                                    return !volumeService.enableToShred(vol);
                                });
                        },
                        onClick: function () {
                            ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                            $location.path(['storage-systems', storageSystemId, 'volumes', 'shred-volumes'].join('/'));
                        }
                    },
                    {
                        icon: 'icon-delete',
                        tooltip: 'action-tooltip-delete',
                        type: 'confirm',

                        confirmTitle: 'virtual-storage-machine-defined-vol-remove-confirmation',
                        confirmMessage: 'virtual-storage-machine-defined-vol-remove-content',
                        enabled: function () {
                            return dataModel.anySelected() && !volumeService.hasGadVolume(dataModel.getSelectedItems()) &&
                                !volumeService.hasShredding(dataModel.getSelectedItems());
                        },
                        onClick: function () {
                            //TODO
                            var payload = {
                                volumeIds: _.map(dataModel.getSelectedItems(), function(v){
                                    return v.volumeId;
                                })
                            }
                            orchestratorService.removeDefinedVolumeFromVsm(virtualStorageMachineId, payload);
                        }
                    }
                ];

                dataModel.getActions = function () {
                    return actions;
                };

                updateResultTotalCounts(result);

                dataModel.getResources = function () {
                    return paginationService.get($scope.dataModel.nextToken, GET_VOLUMES_PATH,
                        objectTransformService.transformVolume, false, storageSystemId);
                };
                $scope.dataModel = dataModel;

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');
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