'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemsCtrl
 * @description
 * # StorageSystemsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemsCtrl', function ($scope, $timeout, orchestratorService, objectTransformService, synchronousTranslateService, scrollDataSourceBuilderService,
                                                $location, diskSizeService, paginationService, capacityAlertService, dpAlertService, jobsAlertService, hwAlertService) {

        var dataProtection;
        var GET_STORAGE_SYSTEM_PATH = 'storage-systems';
        var tiers;
        var unified;

        $scope.services = {
            cp: capacityAlertService,
            dp: dpAlertService,
            job: jobsAlertService,
            hw: hwAlertService
        };

        function transformService(fileSummary) {
            orchestratorService.tiers().then(function (result) {
                tiers = result;
                return orchestratorService.storageSystemsSummary();
            }).then(function (result) {
                result.unified = unified ? true : false;
                var summaryModel = objectTransformService.transformToStorageSummaryModel(result, fileSummary, dataProtection);
                objectTransformService.transformTierSummary(tiers, result.tierSummaryItems, summaryModel);
                summaryModel.title = synchronousTranslateService.translate('common-storage-systems');
                $scope.summaryModel = summaryModel;
            });
        }

        function updateUnifiedTiles(storageSystems) {
            _.each(storageSystems, function (storageSystem) {
                if (storageSystem.unified) {
                    orchestratorService.filePoolSummary(storageSystem.storageSystemId).then(function (result) {
                        storageSystem.bottomSize = diskSizeService.getDisplaySize(result.usedCapacity);
                        storageSystem.bottomTotal = diskSizeService.getDisplaySize(result.overcommitCapacity);
                        var usage = '0%';
                        if (storageSystem.bottomTotal.value !== 0) {
                            usage = parseInt(storageSystem.bottomSize.value / storageSystem.bottomTotal.value * 100).toString() + '%';
                        }
                        storageSystem.fileCapacity = {
                            usagePercentage: usage,
                            file: true
                        };
                    });
                }
            });
        }
        paginationService.getAllPromises(null, GET_STORAGE_SYSTEM_PATH, true, null, objectTransformService.transformStorageSystem).then(function (result) {
            unified = _.find(result, function (storageSystem) { return storageSystem.unified && storageSystem.accessible; });
            var storageSystems = result;
            var hasFileUsageBar = false;
            updateUnifiedTiles(storageSystems);
            orchestratorService.dataProtectionSummary().then(function(result) {
                dataProtection = result;
                if(unified) {
                    orchestratorService.filePoolsSummary().then(function (result) {
                        transformService(result);
                    });
                }
                else {
                    transformService();
                }
            });
            var dataModel = {
                view: 'tile',
                hasFileUsageBar: hasFileUsageBar,
                displayList: result.resources,
                search: {
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
                sort: {
                    field: 'storageSystemId',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            } else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                }
            };

            var actions = [
                {
                    icon: 'icon-delete',
                    tooltip :'action-tooltip-delete',
                    type: 'confirm',
                    confirmTitle: 'storage-system-delete-confirmation',
                    confirmMessage: 'storage-system-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    onClick: function () {
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            item.actions.delete.onClick(orchestratorService);
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
                        if(dataModel.onlyOneSelected()) {
                            var item = _.first(dataModel.getSelectedItems());
                            item.actions.edit.onClick();
                        }
                    }
                }
            ];
            dataModel.getActions = function () {
                return  actions;
            };

            dataModel.addAction = function () {
                $location.path(['storage-systems', 'add'].join('/'));
            };

            dataModel.gridSettings = [
                {
                    title: 'storage-systems-serial-number',
                    sizeClass: 'sixth',
                    sortField: 'storageSystemId',
                    getDisplayValue: function (item) {
                        return item.storageSystemId;
                    },
                    type: 'id'

                },
                {
                    title: 'storage-systems-name',
                    sizeClass: 'sixth',
                    sortField: 'storageSystemName',
                    getDisplayValue: function (item) {
                        return item.storageSystemName;
                    }

                },
                {
                    title: 'storage-systems-svp-ip-address',
                    sizeClass: 'sixth',
                    sortField: 'svpIpAddress',
                    getDisplayValue: function (item) {
                        return item.svpIpAddress;
                    }

                },
                {
                    title: 'storage-systems-model',
                    sizeClass: 'sixth',
                    sortField: 'model',
                    getDisplayValue: function (item) {
                        return item.model;
                    }

                },
                {
                    title: 'common-label-total',
                    sizeClass: 'twelfth',

                    sortField: 'total.value',
                    getDisplayValue: function (item) {
                        return item.total;
                    },
                    type: 'size'

                },
                {
                    title: 'common-label-free',
                    sizeClass: 'twelfth',
                    sortField: 'physicalUsed.value',
                    getDisplayValue: function (item) {
                        return item.physicalFree;
                    },
                    type: 'size'

                },
                {
                    title: 'common-label-used',
                    sizeClass: 'twelfth',
                    sortField: 'physicalUsed.value',
                    getDisplayValue: function (item) {
                        return item.physicalUsed;
                    },
                    type: 'size'

                }
            ];

            $scope.dataModel = dataModel;

            scrollDataSourceBuilderService.setupDataLoader($scope, storageSystems, 'storageSystemSearch');


        });

    });
