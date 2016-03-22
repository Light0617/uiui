'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumesCtrl
 * @description
 * # StorageSystemVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemVolumesCtrl', function ($scope, $routeParams, $timeout, $filter, $location,
                                                      objectTransformService, orchestratorService,
                                                      scrollDataSourceBuilderServiceNew, ShareDataService,
                                                      inventorySettingsService, paginationService, queryService,
                                                      storageSystemVolumeService) {
        var storageSystemId = $routeParams.storageSystemId;
        var storageSystem;
        var GET_VOLUMES_PATH = 'volumes';
        $scope.dataModel = {};

        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            storageSystem = result;
            return orchestratorService.dataProtectionSummaryForStorageSystem(storageSystemId);
        }).then(function (result) {
            var summaryModel = objectTransformService.transformToStorageSummaryModel(storageSystem, null, result);
                summaryModel.title = 'Volumes';
                summaryModel.protectedVolume = result.protectedVolumes;
                summaryModel.unprotectedVolume = result.unprotectedVolumes;
                summaryModel.secondaryVolume = result.secondaryVolumes;
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

            storageSystemVolumeService.getVolumePairsAsPVol(null, volumeId, storageSystemId).then(function (result) {

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
                displayList: result.resources,
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
                        $location.path(['storage-systems', storageSystemId, 'attach-volumes'].join(
                            '/'));
                    },
                    enabled: function () {
                        return dataModel.anySelected();
                    }
                },
                {
                    icon: 'icon-data-protection',
                    tooltip: 'action-tooltip-protect-volumes',
                    type: 'link',
                    onClick: function () {
                        ShareDataService.volumesList = dataModel.getSelectedItems();
                        $location.path(['storage-systems', storageSystemId,
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

            dataModel.getResources = function(){
                return paginationService.get($scope.dataModel.nextToken, GET_VOLUMES_PATH, objectTransformService.transformVolume, false, storageSystemId);
            };
            $scope.dataModel = dataModel;

            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');
        });

        var updateResultTotalCounts = function(result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.displayList = result.resources;
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        $scope.filterModel = {
            filter: {
                freeText: '',
                volumeType: '',
                replicationType: [],
                protectionStatusList: [],
                snapshot: false,
                clone: false,
                protected: false,
                unprotected: false,
                secondary: false,
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
                var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                paginationService.setFilterSearch(queryObject);
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

    });
