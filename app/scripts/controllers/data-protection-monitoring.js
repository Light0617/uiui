'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:DataProtectionMonitoringCtrl
 * @description
 * # DataProtectionMonitoringCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('DataProtectionMonitoringCtrl', function ($scope, $timeout, $routeParams, orchestratorService, volumeService,
                                                          objectTransformService, synchronousTranslateService,
                                                          scrollDataSourceBuilderService, $location, ShareDataService,
                                                          monitoringService, inventorySettingsService, storageSystemVolumeService,
                                                          replicationService) {

        var storageSystemId = $routeParams.storageSystemId;
        if(storageSystemId) {
            $scope.storageSystemId = storageSystemId;
        }

        var volumeUnprotectActions = function (selectedVolume) {
            ShareDataService.volumeListForUnprotect = selectedVolume;

            if (storageSystemId) {
                $location.path(['storage-systems', storageSystemId, 'data-protection-monitoring', 'unprotect'].join('/'));
            }
            else {
                $location.path(['data-protection-monitoring', 'unprotect'].join('/'));
            }
        };

        var volumeRestoreAction = function (action, selectedVolumes) {

            var volumeId = 0;
            var path = '';
            if(selectedVolumes && selectedVolumes.length>0){
                volumeId = selectedVolumes[0].volumeId;
            }
            if(!storageSystemId){
                storageSystemId = selectedVolumes[0].storageSystemId;
                ShareDataService.restoreStorageSystemId = storageSystemId;
                path = ['data-protection-monitoring', 'volume-actions-restore-selection'].join('/');
            } else{
                path = ['storage-systems', storageSystemId, 'data-protection-monitoring', 'volume-actions-restore-selection'].join('/');
            }

            storageSystemVolumeService.getVolumePairsAsPVolWithoutSnapshotFullcopy(null, volumeId, storageSystemId).then(function (result) {

                ShareDataService.SVolsList = _.filter(result.resources, function(SVol){ return SVol.primaryVolume && SVol.secondaryVolume && SVol.replicationGroup; });
                ShareDataService.restorePrimaryVolumeId = volumeId;
                ShareDataService.restorePrimaryVolumeToken = result.nextToken;

                _.forEach(ShareDataService.SVolsList, function (volume) {
                    volume.selected = false;
                });
                $location.path(path);
            });
        };


        var setVolumeActions = function (dataModel) {
            var actions = [
                {
                    icon: 'icon-delete',
                    type: 'confirm',
                    tooltip: 'action-tooltip-delete',
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
                        return dataModel.onlyOneSelected() && _.some(dataModel.getSelectedItems(),
                            function (vol) {
                                return volumeService.restorable(vol);
                            });
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

        };

        var setHostActions = function(dataModel) {
            var actions = [
                {
                    icon: 'icon-delete',
                    type: 'confirm',
                    tooltip: 'action-tooltip-delete',
                    confirmTitle: 'host-delete-confirmation',
                    confirmMessage: 'host-delete-selected-content',
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
                    type: 'dropdown',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    items: [
                        {
                            type: 'link',
                            title: 'storage-attach-volumes',
                            onClick: function () {
                                ShareDataService.push('selectedServers', dataModel.getSelectedItems());
                                $location.path('/hosts/attach-volumes');
                            }
                        },
                        {
                            type: 'link',
                            title: 'host-create-attach-protect-volumes',
                            onClick: function () {
                                ShareDataService.push('selectedServers', dataModel.getSelectedItems());
                                $location.path('hosts/create-and-attach-volumes');
                            }
                        }
                    ]
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

        };

        monitoringService.getDpAlerts(function (result) {
            var summaryModel = objectTransformService.transformToDpSummaryModel();
            summaryModel.alerts.dp.count = result.total;
            summaryModel.alerts.dp.hostCount = result.totalHostAlertCount;
            summaryModel.alerts.dp.volumeCount = result.totalVolumeAlertCount;
            var UNHEALTHY_STATUS = 'error';
            if (result.total !== 0) {
                summaryModel.alerts.dp.level = UNHEALTHY_STATUS;
            }
            summaryModel.title = synchronousTranslateService.translate('common-data-protection-monitoring');
            monitoringService.getSummaryStatus(function (result) {
                $scope.hardwareAlertTotals = result.hardwareAlertTotals;
                $scope.capacityAlertTotals = result.capacityAlertTotals;
                summaryModel.alerts.capacity.count = $scope.capacityAlertTotals.totalComponentWiseCapacityAlerts;
                summaryModel.alerts.hardware.count = $scope.hardwareAlertTotals.totalComponentWiseHardwareAlerts;
                if (summaryModel.alerts.hardware.count !== 0 && summaryModel.alerts.hardware.count !== '0') {
                    summaryModel.alerts.hardware.level = UNHEALTHY_STATUS;
                }
                if (summaryModel.alerts.capacity.count !== 0 && summaryModel.alerts.capacity.count !== '0') {
                    summaryModel.alerts.capacity.level = UNHEALTHY_STATUS;
                }
            });


            summaryModel.interval = 0;
            var items = [];
            items.push(displayAlert('Volumes', summaryModel.alerts.dp.volumeCount));
            items.push(displayAlert('Servers', summaryModel.alerts.dp.hostCount));


            summaryModel.slides = [{ items : items}];

            $scope.summaryModel = summaryModel;

            var volumes = result.volumes;
            var servers = result.servers;
            var dataModel = {
                volumes: volumes,
                servers: servers,
                view: 'list',
                allItemsSelected: false,
                hasDelete: true,
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
                    },
                    utilization: {
                        min: 0,
                        max: 100
                    }
                },
                sort: {
                    field: 'volumeId',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            }
                            else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                },
                isDPMonitoring: true,
                getSelectedVolumeCount: function(){
                    var selectedCount = 0;
                    _.forEach($scope.dataModel.filteredList, function(volume) {
                        if (volume.selected === true) {
                            selectedCount++;
                        }
                    });

                    return selectedCount;
                },
                containUnprotectedVolume: function () {
                    var containUnprotectedVolume = false;
                    _.forEach($scope.dataModel.filteredList, function (volume) {
                        if (volume.selected && volume.dataProtectionSummary.volumeType.indexOf('P-VOL') === -1) {
                            containUnprotectedVolume = true;
                            return;
                        }
                    });
                    return containUnprotectedVolume;
                },
                isVolumes: true
            };
            setVolumeActions(dataModel);
            inventorySettingsService.setVolumesGridSettings(dataModel, {
                canAdd: false
            });

            $scope.dataModel = dataModel;
            scrollDataSourceBuilderService.setupDataLoader($scope, volumes, 'storageSystemVolumesSearch');
        });

        function displayAlert (alertType, numberOfAlert) {
            var item = {};
            item.displayName = alertType;
            if (numberOfAlert > 0) {
                item.numberOfAlert = numberOfAlert;
                item.badgeClass = 'danger';
            }
            else {
                item.badgeClass = 'disabled';
                item.numberOfAlert = 0;
            }
            if (alertType === 'Volumes') {
                item.id = 'volume';
                item.itemClass = 'active';
                item.iconClass = 'icon-volume';
                item.onClick = function() {
                    scrollDataSourceBuilderService.setupDataLoader($scope, $scope.dataModel.volumes, 'storageSystemVolumesSearch');
                    inventorySettingsService.setVolumesGridSettings($scope.dataModel, {
                        canAdd: false
                    });
                    setVolumeActions($scope.dataModel);
                    $scope.dataModel.isVolumes = true;
                    $scope.filterModel = $scope.volumesFilterModel;
                };
            }
            else {
                item.id = 'host';
                item.itemClass = '';
                item.iconClass = 'icon-host';
                item.onClick = function() {
                    scrollDataSourceBuilderService.setupDataLoader($scope, $scope.dataModel.servers, 'hostSearch');
                    inventorySettingsService.setHostGridSettings($scope.dataModel);
                    setHostActions($scope.dataModel);
                    $scope.dataModel.isVolumes = false;
                    $scope.filterModel = $scope.hostsFilterModel;
                };
            }
            return item;
        }
        
        $scope.volumesFilterModel = {
            filterDpType: function () {
                var replicationTypes = [];
                if ($scope.dataModel.snapshotex) {
                    replicationTypes.push(replicationService.rawTypes.SNAP_ON_SNAP);
                }
                if ($scope.dataModel.snapshotfc) {
                    replicationTypes.push(replicationService.rawTypes.SNAP_CLONE);
                }
                if ($scope.dataModel.snapshot) {
                    replicationTypes.push(replicationService.rawTypes.SNAP);
                }
                if ($scope.dataModel.cloneNow) {
                    replicationTypes.push(replicationService.rawTypes.CLONE);
                }
                $scope.dataModel.search.replicationTypes = replicationTypes;
            },
            filterProtectionStatus: function () {
                var protectionStatusList = [];
                if ($scope.dataModel.protected) {
                    protectionStatusList.push('P-VOL');
                }
                if ($scope.dataModel.unprotected) {
                    protectionStatusList.push('UNPROTECTED');
                }
                if ($scope.dataModel.secondary) {
                    protectionStatusList.push('S-VOL');
                }
                $scope.dataModel.search.protectionStatusList = protectionStatusList;
            }
        };

        $scope.hostsFilterModel = {
            filterOperatingSystem: function () {
                var enabledOperatingSystemType = [];
                var operatingSystemType = $scope.filterModel.operatingSystemType;
                for (var key in  operatingSystemType) {
                    if (operatingSystemType[key]) {
                        enabledOperatingSystemType.push(key);
                    }
                }
                $scope.dataModel.search.osType = enabledOperatingSystemType;
            },
            filterDpType: function () {
                var replicationTypes = [];
                if ($scope.dataModel.snapshotex) {
                    replicationTypes.push(replicationService.rawTypes.SNAP_ON_SNAP);
                }
                if ($scope.dataModel.snapshotfc) {
                    replicationTypes.push(replicationService.rawTypes.SNAP_CLONE);
                }
                if ($scope.dataModel.snapshot) {
                    replicationTypes.push(replicationService.rawTypes.SNAP);
                }
                if ($scope.dataModel.cloneNow) {
                    replicationTypes.push(replicationService.rawTypes.CLONE);
                }
                $scope.dataModel.search.replicationTypes = replicationTypes;
            }
        };
        $scope.filterModel = $scope.volumesFilterModel;
    });
