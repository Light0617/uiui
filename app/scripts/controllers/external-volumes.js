'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumesCtrl
 * @description
 * # StorageSystemVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ExternalVolumesCtrl', function ($scope, $modal, $routeParams, $timeout, $filter, $location,
                                                      objectTransformService, orchestratorService, volumeService,
                                                      scrollDataSourceBuilderServiceNew, ShareDataService,
                                                      inventorySettingsService, paginationService, queryService,
                                                      storageSystemVolumeService, dpAlertService, storageNavigatorSessionService,
                                                      constantService, resourceTrackerService, replicationService, gadVolumeTypeSearchService) {
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
            $scope.summaryModel.dpAlert.update();
        });

        paginationService.get(null, GET_VOLUMES_PATH, objectTransformService.transformVolume, true, storageSystemId).then(function (result) {
            paginationService.clearQuery();
            var dataModel = {
                view: 'tile',
                storageSystemId: storageSystemId,
                nextToken: result.nextToken,
                total: result.total,
                currentPageCount: 0,
                isAddExtVolume: true,
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
                return _.find(selectedVolumes, function(volume) {return volume.isGadVolume();}) !== undefined;
            };

            //prevalidation for deleting volumes that are already attached to UI
            var hasPrevalidationForDeleting = function(selectedVolumes)  {
                return _.find(selectedVolumes, function(volume) {return volume.isPrevalidationForDeleting();}) !== undefined;
            };

            var actions = [
                {
                    icon: 'icon-delete',
                    tooltip: 'action-tooltip-delete',
                    type: 'confirm',

                    confirmTitle: 'storage-volume-delete-confirmation',
                    confirmMessage: 'storage-volume-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected() &&
                            !hasGadVolume(dataModel.getSelectedItems()) && !hasPrevalidationForDeleting(dataModel.getSelectedItems()) &&
                            //block deleting if the migration status is true
                            !_.some(dataModel.getSelectedItems(), function (vol) {
                                return vol.scheduledForMigration;
                            });
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
                    icon: 'icon-migrate-volume',
                    tooltip: 'action-tooltip-migrate-volumes',
                    type: 'link',
                    enabled: function () {
                        return !hasGadVolume(dataModel.getSelectedItems()) && !_.some(dataModel.getSelectedItems(),
                            function (vol) {
                                return !vol.isUnprotected();
                            }) && $scope.selectedCount > 0;
                    },
                    onClick: function () {
                        // maximum number of volumes to migrate is 14
                        ShareDataService.selectedMigrateVolumes = _.first(dataModel.getSelectedItems(), 14);
                        $location.path(['hosts','migrate-volumes'].join('/'));
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
    });
