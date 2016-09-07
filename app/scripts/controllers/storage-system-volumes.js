'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumesCtrl
 * @description
 * # StorageSystemVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemVolumesCtrl', function ($scope, $modal, $routeParams, $timeout, $filter, $location,
                                                      objectTransformService, orchestratorService, volumeService,
                                                      scrollDataSourceBuilderServiceNew, ShareDataService,
                                                      inventorySettingsService, paginationService, queryService,
                                                      storageSystemVolumeService, dpAlertService, storageNavigatorSessionService,
                                                      constantService, resourceTrackerService) {
        var storageSystemId = $routeParams.storageSystemId;
        var storageSystem;
        var GET_VOLUMES_PATH = 'volumes';
        ShareDataService.showProvisioningStatus = true;
        ShareDataService.showPoolBreadCrumb = false;
        $scope.dataModel = {
            view: 'tile',
            storageSystemId: storageSystemId,
            currentPageCount: 0,
            busy: false,
            sort: {
                field: 'volumeId',
                reverse: false
            }
        };

        var sn2Action = storageNavigatorSessionService.getNavigatorSessionAction(storageSystemId, constantService.sessionScope.VOLUMES);
        sn2Action.icon = 'icon-storage-navigator-settings';
        sn2Action.tooltip = 'tooltip-configure-storage-system-volumes';
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

        $scope.filterModel = {};

        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            storageSystem = result;
            return orchestratorService.dataProtectionSummaryForStorageSystem(storageSystemId);
        }).then(function (result) {
            var summaryModel = objectTransformService.transformToStorageSummaryModel(storageSystem, null, result);

            summaryModel.title = 'Volumes';
            summaryModel.protectedVolume = result.protectedVolumes;
            summaryModel.unprotectedVolume = result.unprotectedVolumes;
            summaryModel.secondaryVolume = result.secondaryVolumes;
            summaryModel.dpAlert = dpAlertService;
            summaryModel.getActions = $scope.summaryModel.getActions;
            $scope.summaryModel = summaryModel;
        });

        var volumeUnprotectActions = function (selectedVolume) {
            ShareDataService.volumeListForUnprotect = selectedVolume;

            $location.path(['storage-systems', storageSystemId, 'volumes', 'unprotect'].join('/'));
        };

        var volumeRestoreAction = function (action, selectedVolumes) {

            var volumeId = 0;
            if (selectedVolumes && selectedVolumes.length > 0) {
                volumeId = selectedVolumes[0].volumeId;
            }

            storageSystemVolumeService.getVolumePairsAsPVolWithoutSnapshotFullcopy(null, volumeId, storageSystemId).then(function (result) {

                ShareDataService.SVolsList = _.filter(result.resources, function(SVol){ return SVol.primaryVolume && SVol.secondaryVolume; });
                ShareDataService.restorePrimaryVolumeId = volumeId;
                ShareDataService.restorePrimaryVolumeToken = result.nextToken;

                _.forEach(ShareDataService.SVolsList, function (volume) {
                    volume.selected = false;
                });
                $location.path(['/storage-systems/', storageSystemId, '/volumes/volume-actions-restore-selection'].join(''));
            });
        };

        paginationService.get(null, GET_VOLUMES_PATH, objectTransformService.transformVolume, true, storageSystemId).then(function (result) {
            paginationService.clearQuery();
            var dataModel = {
                view: 'tile',
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
                            paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function(result) {
                                updateResultTotalCounts(result);
                            });
                        });
                    }
                }
            };

            $scope.filterModel = {
                filter: {
                    freeText: '',
                    volumeType: '',
                    provisioningStatus: '',
                    dkcDataSavingType: '',
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
                            // The following two ifs are because "GAD" and ("Active primary" or "Active secondary") is querying on the same attribute.
                            // Need a way to avoid the conflicts, this's only for volume inventory page.
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
                        }
                    } else {
                        // The following if is because "GAD" and ("Active primary" or "Active secondary") is querying on the same attribute.
                        // Need a way to avoid the conflicts, this's only for volume inventory page.
                        if (!($scope.filterModel.filter.gad && key === 'gadSummary.volumeType' &&
                            (arrayClearKey === 'Active-Primary' || arrayClearKey === 'Active-Secondary'))) {
                            queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                            paginationService.setFilterSearch(queryObject);
                        }
                    }
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                sliderQuery: function(key, start, end, unit) {
                    paginationService.setSliderSearch(key, start, end, unit);
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().INT, value));
                    queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                }
            };

            inventorySettingsService.setVolumesGridSettings(dataModel);

            var hasGadVolume = function(selectedVolumes)  {
                return _.find(selectedVolumes, function(volume) {return volume.gadSummary !== null;}) !== undefined;
            };

            var actions = [
                {
                    icon: 'icon-delete',
                    tooltip: 'action-tooltip-delete',
                    type: 'confirm',

                    confirmTitle: 'storage-volume-delete-confirmation',
                    confirmMessage: 'storage-volume-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected() && !hasGadVolume(dataModel.getSelectedItems());
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
                        resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                            'Delete Volumes Confirmation', storageSystemId, volIds, null, orchestratorService.deleteVolume);

                    }
                },
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && !hasGadVolume(dataModel.getSelectedItems());
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
                        if(flags.areAllItemsTrue() ) {
                            // Build reserved resources
                            var reservedResourcesList = [];
                            _.forEach(dataModel.getSelectedItems(), function (item) {
                                reservedResourcesList.push(item.volumeId + '=' + resourceTrackerService.volume());
                            });

                            // Show popup if resource is present in resource tracker else redirect
                            resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                                'Attach Volumes Confirmation', null, null, null, null, function() {
                                    ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                                    $location.path(['storage-systems', storageSystemId, 'attach-volumes'].join(
                                        '/'));
                                });
                        } else {
                            var modelInstance = $modal.open({
                                templateUrl: 'views/templates/attach-volume-confirmation-modal.html',
                                windowClass: 'modal fade confirmation',
                                backdropClass: 'modal-backdrop',
                                controller: function ($scope) {
                                    $scope.cancel = function () {
                                        modelInstance.dismiss('cancel');
                                    };

                                    $scope.ok = function() {
                                        // Build reserved resources
                                        var reservedResourcesList = [];
                                        _.forEach(dataModel.getSelectedItems(), function (item) {
                                            reservedResourcesList.push(item.volumeId + '=' + resourceTrackerService.volume());
                                        });

                                        // Show popup if resource is present in resource tracker else redirect
                                        resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                                            'Attach Volumes Confirmation', null, null, null, null, function() {
                                                ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                                                $location.path(['storage-systems', storageSystemId, 'attach-volumes'].join(
                                                    '/'));
                                            });
                                        modelInstance.close(true);
                                    };

                                    modelInstance.result.finally(function() {
                                        $scope.cancel();
                                    });
                                }
                            });
                        }
                    },
                    enabled: function () {
                        return dataModel.anySelected() && !hasGadVolume(dataModel.getSelectedItems());
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
                        // Build reserved resources
                        var item = _.first(dataModel.getSelectedItems());
                        var reservedResourcesList = [];
                        reservedResourcesList.push(item.volumeId + '=' + resourceTrackerService.volume());

                        // Show popup if resource is present in resource tracker else redirect
                        resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                            'Detach Volume Confirmation', null, null, null, null, item.actions.detach.onClick);
                    }
                },
                {
                    icon: 'icon-data-protection',
                    tooltip: 'action-tooltip-protect-volumes',
                    type: 'link',
                    onClick: function () {
                        // Build reserved resources
                        var reservedResourcesList = [];
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            reservedResourcesList.push(item.volumeId + '=' + resourceTrackerService.volume());
                        });

                        // Show popup if resource is present in resource tracker else redirect
                        resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                            'Protect Volumes Confirmation', null, null, null, null, function() {
                                ShareDataService.volumesList = dataModel.getSelectedItems();
                                $location.path(['storage-systems', storageSystemId,
                                    'volumes/protect'
                                ].join('/'));
                            });
                    },
                    enabled: function () {
                        return dataModel.anySelected() && !hasGadVolume(dataModel.getSelectedItems());
                    }
                },
                {
                    icon: 'icon-remove-volume',
                    tooltip: 'action-tooltip-unprotect-volumes',
                    type: 'link',
                    onClick: function () {
                        // Build reserved resources
                        var reservedResourcesList = [];
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            reservedResourcesList.push(item.volumeId + '=' + resourceTrackerService.volume());
                        });

                        // Show popup if resource is present in resource tracker else redirect
                        resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                            'Unprotect Volume Confirmation', null, null, null, null, function() {
                                volumeUnprotectActions(dataModel.getSelectedItems());
                            });
                    },
                    enabled: function () {
                        return dataModel.onlyOneSelected() && !_.some(dataModel.getSelectedItems(),
                            function (vol) {
                                return vol.isUnprotected();
                            }) && !hasGadVolume(dataModel.getSelectedItems());
                    }
                },
                {
                    icon: 'icon-refresh',
                    tooltip: 'action-tooltip-restore-volumes',
                    type: 'link',
                    onClick: function () {
                        // Build reserved resources
                        var reservedResourcesList = [];
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            reservedResourcesList.push(item.volumeId + '=' + resourceTrackerService.volume());
                        });

                        // Show popup if resource is present in resource tracker else redirect
                        resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                            'Restore Volume Confirmation', null, null, null, null, function() {
                                volumeRestoreAction('restore', dataModel.getSelectedItems());
                            });
                    },
                    enabled: function () {
                        return dataModel.onlyOneSelected() && _.some(dataModel.getSelectedItems(),
                            function (vol) {
                                return volumeService.restorable(vol);
                            }) && !hasGadVolume(dataModel.getSelectedItems());
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

            dataModel.cachedList = result.resources;
            dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

            dataModel.getResources = function(){
                return paginationService.get($scope.dataModel.nextToken, GET_VOLUMES_PATH, objectTransformService.transformVolume, false, storageSystemId);
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

        Array.prototype.areAllItemsTrue = function() {
            for(var i = 0; i < this.length; i++) {
                if(this[i] === false) {
                    return false;
                }
            }
            return true;
        };
    });
