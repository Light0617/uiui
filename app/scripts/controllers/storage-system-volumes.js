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
                                                      storageSystemVolumeService, dpAlertService,
                                                      storageNavigatorLaunchActionService,
                                                      constantService, resourceTrackerService, replicationService, attachVolumeService,
                                                      gadVolumeTypeSearchService, migrationTaskService, virtualizeVolumeService, $q, utilService) {
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

        $scope.summaryModel = {};

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
                freeCapacity: constantService.CAPACITY_FILTER_DEFAULT_CONDITION(),
                totalCapacity: constantService.CAPACITY_FILTER_DEFAULT_CONDITION(),
                utilization: {
                    min: 0,
                    max: 100
                },
                migrationType: ''
            }
        };

        var createSummaryModelActions = function(storageSystem) {
            var summaryModelActions = storageNavigatorLaunchActionService.createNavigatorLaunchAction(
                storageSystem,
                constantService.sessionScope.VOLUMES,
                'icon-storage-navigator-settings',
                'tooltip-configure-storage-system-volumes');

            summaryModelActions['interrupt-shredding'] = {
                    icon: 'icon-cancel-volume-shredding',// TODO Change icon
                    title :'interrupt-shredding',
                    tooltip: 'interrupt-shredding',
                    type: 'confirm',
                    confirmTitle: 'interrupt-shredding-confirmation-title',
                    confirmMessage: 'interrupt-shredding-confirmation-message',
                    enabled: function () {
                        return true;
                    },
                    onClick: function (orchestratorService) {
                        var payload = {
                            storageSystemId: storageSystemId
                        };
                        orchestratorService.interruptShreddings(payload);
                    }
                };
            return summaryModelActions;
        };

        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            storageSystem = result;
            var summaryModelActions = createSummaryModelActions(storageSystem);
            $scope.summaryModel.getActions = function () {
                return _.map(summaryModelActions);
            };
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
                            paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function (result) {
                                updateResultTotalCounts(result);
                            });
                        });
                    }
                }
            };

            $scope.filterModel = _.extend($scope.filterModel, {
                $replicationRawTypes: replicationService.rawTypes,
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
                migrationFilterQuery: function (type, isManaged) {
                    migrationTaskService.volumeMigrationTypeFilter(type, isManaged, $scope.filterModel.filter.migrationType);
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
                    queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().INT, value));
                    queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                }
            });

            inventorySettingsService.setVolumesGridSettings(dataModel);

            var actions =  volumeService.getActions(dataModel, resourceTrackerService, orchestratorService, $modal, storageSystemId,
                storageSystemVolumeService, virtualizeVolumeService, utilService, paginationService,
                migrationTaskService, attachVolumeService);

            dataModel.getActions = function () {
                return actions;
            };

            dataModel.cachedList = result.resources;
            dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

            dataModel.getResources = function () {
                return paginationService.get($scope.dataModel.nextToken, GET_VOLUMES_PATH, objectTransformService.transformVolume, false, storageSystemId);
            };
            $scope.dataModel = dataModel;

            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');
        });

        var updateResultTotalCounts = function (result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = result.resources;
            $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        Array.prototype.areAllItemsTrue = function () {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === false) {
                    return false;
                }
            }
            return true;
        };
    });
