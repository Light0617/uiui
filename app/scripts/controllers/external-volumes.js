'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumesCtrl
 * @description
 * # StorageSystemVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ExternalVolumesCtrl', function (
        $scope, $modal, $routeParams, $timeout, $filter, $location,
        objectTransformService, orchestratorService, volumeService,
        scrollDataSourceBuilderServiceNew, ShareDataService,
        inventorySettingsService, paginationService, queryService,
        storageSystemVolumeService, dpAlertService, storageNavigatorSessionService,
        constantService, resourceTrackerService, replicationService, gadVolumeTypeSearchService,
        migrationTaskService, synchronousTranslateService, utilService
    ) {
        var storageSystemId = $routeParams.storageSystemId;
        var GET_EXTERNAL_VOLUMES_PATH = 'external-volumes';
        var GET_EXTERNAL_PARITY_GROUPS_PATH = 'external-parity-groups';
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

        var createSnLaunchAction = function(storageSystem) {
            var isSvpLess = utilService.isNullOrUndef(storageSystem.svpIpAddress);
            if (isSvpLess) {
                return {};
            }

            var sn2Action = storageNavigatorSessionService.getNavigatorSessionAction(storageSystemId, constantService.sessionScope.VOLUMES);
            sn2Action.icon = 'icon-storage-navigator-settings';
            sn2Action.tooltip = 'tooltip-configure-storage-system-volumes';
            sn2Action.enabled = function () {
                return true;
            };
            return {
                'SN2': sn2Action
            };
        };

        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            var summaryModelActions = createSnLaunchAction(result);
            $scope.summaryModel.getActions = function () {
                return _.map(summaryModelActions);
            };
            return orchestratorService.dataProtectionSummaryForStorageSystem(storageSystemId);
        });

        $scope.filterModel = {
            filter: {
                freeText: '',
                volumeType: '',
                previousVolumeType: '',
                provisioningStatus: '',
                replicationType: [],
                protectionStatusList: [],
                migrationType: '',
                volumeStatus: '',
                snapshotex: false,
                snapshotfc: false,
                snapshot: false,
                clone: false,
                protected: false,
                unprotected: false,
                secondary: false,
                size: constantService.CAPACITY_FILTER_DEFAULT_CONDITION()
            }
        };

        var externalParityGroupMap = {};
        var transformExternalVolume = function (item) {
            objectTransformService.transformExternalVolume(item);
            var externalParityGroup = externalParityGroupMap[item.externalParityGroupId];
            objectTransformService.mergeExtParityGroupToExternalVolume(item, externalParityGroup);
        };

        paginationService.getAllPromises(null, GET_EXTERNAL_PARITY_GROUPS_PATH, true, storageSystemId).then(function (results) {
            _.forEach(results, function (item) {
                externalParityGroupMap[item.externalParityGroupId] = item;
            });
            return paginationService.get(null, GET_EXTERNAL_VOLUMES_PATH, transformExternalVolume, true, storageSystemId);
        }).then(function (result) {
            paginationService.clearQuery();
            var dataModel = {
                view: 'tile',
                title: synchronousTranslateService.translate('common-external-volumes'),
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
                            paginationService.getQuery(GET_EXTERNAL_VOLUMES_PATH, transformExternalVolume, storageSystemId).then(function(result) {
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
                    var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                    paginationService.setFilterSearch(queryObject);
                    paginationService.getQuery(GET_EXTERNAL_VOLUMES_PATH, transformExternalVolume, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                migrationFilterQuery: function (type, isManaged) {
                    migrationTaskService.volumeMigrationTypeFilter(type, isManaged, $scope.filterModel.filter.migrationType);
                    paginationService.getQuery(GET_EXTERNAL_VOLUMES_PATH, transformExternalVolume, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                sliderQuery: function(key, start, end, unit) {
                    paginationService.setSliderSearch(key, start, end, unit);
                    paginationService.getQuery(GET_EXTERNAL_VOLUMES_PATH, transformExternalVolume, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().INT, value));
                    queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(GET_EXTERNAL_VOLUMES_PATH, transformExternalVolume, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                }
            });

            inventorySettingsService.setExternalVolumeGridSettings(dataModel);


            function generateUnvirtualizeDialogSettings () {
                var dialogSettings = {
                    id: 'securityEnableDisableConfirmation',
                    dialogTitle: 'external-volumes-unvirtualize-confirmation',
                    content: 'external-volumes-unvirtualize-content',
                    trueText: 'external-volumes-unvirtualize-remove-zone',
                    falseText: 'external-volumes-unvirtualize-keep-zone-intact',
                    switchEnabled: {
                        value: false
                    }
                };

                return dialogSettings;
            }

            var actions = [
                // volume migration
                {
                    icon: 'icon-migrate-volume',
                    tooltip: 'action-tooltip-migrate-volumes',
                    type: 'link',
                    enabled: function () {
                        return migrationTaskService.isAllMigrationAvailable(dataModel.getSelectedItems()) &&
                            dataModel.getSelectedCount() > 0 && dataModel.getSelectedCount() <= 300;
                    },
                    onClick: function () {
                        ShareDataService.selectedMigrateVolumes = dataModel.getSelectedItems();
                        $location.path(['storage-systems', storageSystemId, 'migrate-volumes'].join('/'));
                    }
                },
                // unvirtualize TODO change icon
                {
                    icon: 'icon-delete',
                    tooltip: 'action-tooltip-unvirtualize',
                    type: 'confirmation-modal',
                    dialogSettings: generateUnvirtualizeDialogSettings(),

                    enabled: function () {
                        this.dialogSettings.disableRadioButton = !_.some(dataModel.getSelectedItems(), function (item) {
                            return item.provisioningStatus === 'ATTACHED';
                        });
                        return dataModel.anySelected() &&
                            //block deleting if the migration status is true
                            !_.some(dataModel.getSelectedItems(), function (vol) {
                                return vol.isMigrating() ||
                                    vol.status === 'BLOCKED' ||
                                    vol.provisioningStatus === 'UNMANAGED';
                            });
                    },

                    confirmClick: function () {
                        // Build reserved resources
//                        var reservedResourcesList = [];

                        var enabled = this.dialogSettings.switchEnabled.value;
                        var volIds = [];
                        _.forEach(dataModel.getSelectedItems(), function (item) {
//                            reservedResourcesList.push(item.volumeId + '=' + resourceTrackerService.volume());
                            volIds.push(item.volumeId);
                        });
                        var unvirtualizePayload = {
                            storageSystemId: storageSystemId,
                            volumeIds: volIds,
                            cleanupZones: enabled
                        };

                        // Show popup if resource is present in resource tracker else submit
//                        resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId,
//                            resourceTrackerService.storageSystem(), 'Unvirtualize Confirmation', null, null,
//                            unvirtualizePayload, orchestratorService.unvirtualizeVolume);
                        // FIXME Server is not supported of ExternalVolume reservation. So, execute without check.
                        orchestratorService.deleteExternalVolumes(unvirtualizePayload);
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

            dataModel.cachedList = result.resources;
            dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

            dataModel.getResources = function(){
                return paginationService.get($scope.dataModel.nextToken, GET_EXTERNAL_VOLUMES_PATH, transformExternalVolume, false, storageSystemId);
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
