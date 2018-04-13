'use strict';

/**
 * @ngdoc service
 * @name rainierApp.inventorySettingsService
 * @description
 * # inventorySettingsService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('inventorySettingsService', function($timeout, diskSizeService, orchestratorService, ShareDataService,
        $location, replicationService, synchronousTranslateService) {

        var volumeGridSettings = function(dataModel, options) {

            options = angular.extend({
                canAdd: true
            }, options);



            dataModel.gridSettings = [{
                title: 'ID',
                sizeClass: 'sixteenth',
                sortField: 'volumeId',
                getDisplayValue: function(item) {
                    return item.displayVolumeId;
                },
                type: 'id'

            },
            {
                title: 'virtual-volume-id',
                sizeClass: 'sixteenth',
                sortField: 'gadSummary.virtualLdevId',
                getDisplayValue: function(item) {
                    return item.gadSummary.virtualLdevId;
                }

            },
            {
                title: 'storage-systems-serial-number',
                sizeClass: 'sixteenth',
                sortField: 'storageSystemId',
                getDisplayValue: function(item) {
                    return item.storageSystemId;
                }
            }, {
                title: 'Name',
                sizeClass: 'twelfth',
                sortField: 'label',
                getDisplayValue: function(item) {
                    return item.label;
                }

            }, {
                title: 'data-protection-type',
                sizeClass: 'sixteenth',
                sortField: 'dataProtectionSummary.replicationType',
                getDisplayValue: function(item) {
                    return item.displayedDpType;
                },
                getToolTipValue: function (item) {
                    return _.map(item.dataProtectionSummary.replicationType, function(elem){
                        return replicationService.tooltip(elem);
                    }).join(', ');
                },
                type: 'dpType'

            }, {
                title: 'data-protection-status',
                sizeClass: 'sixteenth',
                sortField: 'dataProtectionSummary.hasFailures',
                getDisplayValue: function(item) {
                    return item.dpMonitoringStatus;
                }

            }, {
                title: 'volume-capacity-saving-type',
                sizeClass: 'twelfth',
                sortField: 'capacitySavingType',
                getDisplayValue: function (item) {
                    return item.capacitySavingType;
                }
            }, {
                title: 'common-label-total',
                sizeClass: 'sixteenth',

                sortField: 'size',
                getDisplayValue: function(item) {
                    return item.totalCapacity;
                },
                type: 'size'

            }, {
                title: 'common-label-free',
                sizeClass: 'sixteenth',
                sortField: 'availableCapacity',
                getDisplayValue: function(item) {
                    return item.availableCapacity;
                },
                type: 'size'

            }, {
                title: 'common-label-used',
                sizeClass: 'sixteenth',
                sortField: 'usedCapacity',
                getDisplayValue: function(item) {
                    return item.usedCapacity;
                },
                type: 'size'

            }];

            if(ShareDataService.showProvisioningStatus === true) {
                dataModel.gridSettings.push({
                    title: 'volume-provisioning-status',
                    sizeClass: 'twelfth',
                    sortField: 'provisioningStatus',
                    getDisplayValue: function(item) {
                        return item.provisioningStatus;
                    }
                });
            }

            dataModel.gridSettings.push({
                title: 'assigned-to-migration',
                sizeClass: 'sixteenth',
                sortField: 'assignedToMigration',
                getDisplayValue: function(item) {
                    return item.assignedToMigration();
                }
            });

            if (options.canAdd) {
                dataModel.addAction = function () {
                    $location.path(['storage-systems', dataModel.storageSystemId, 'volumes', 'add'].join('/'));
                };
                dataModel.addPoolDetailsClickAction = function(storagePoolId) {
                    ShareDataService.push('autoSelectedPoolId', storagePoolId);
                    $location.path(['storage-systems', dataModel.storageSystemId, 'storage-pools',
                        dataModel.storagePoolId, 'volumes', 'add'
                    ].join('/'));
                };
            }

        };

        var externalVolumeGridSettings = function (dataModel) {
            dataModel.gridSettings = [
                {
                    title: 'ID',
                    sizeClass: 'sixteenth',
                    sortField: 'volumeId',
                    getDisplayValue: function (item) {
                        return item.displayVolumeId;
                    },
                    type: 'id'
                },
                {
                    title: 'storage-systems-serial-number',
                    sizeClass: 'sixteenth',
                    sortField: 'storageSystemId',
                    getDisplayValue: function(item) {
                        return item.storageSystemId;
                    }
                },
                {
                    title: 'common-label-total',
                    sizeClass: 'sixteenth',
                    sortField: 'size',
                    getDisplayValue: function(item) {
                        return item.capacity;
                    },
                    type: 'size'
                },
                {
                    title: 'volume-provisioning-status',
                    sizeClass: 'twelfth',
                    sortField: 'provisioningStatus',
                    getDisplayValue: function(item) {
                        return item.provisioningStatus;
                    }
                },
                {
                    title: 'status',
                    sizeClass: 'twelfth',
                    sortField: 'status',
                    getDisplayValue: function(item) {
                        return item.status;
                    }
                },
                {
                    title: 'assigned-to-migration',
                    sizeClass: 'sixteenth',
                    sortField: 'assignedToMigration',
                    getDisplayValue: function(item) {
                        return item.assignedToMigration();
                    }
                },
                {
                    title: 'common-external-parity-group-id',
                    sizeClass: 'sixteenth',
                    sortField: 'externalParityGroupId',
                    getDisplayValue: function(item) {
                        return item.externalParityGroupId;
                    }
                },
                {
                    title: 'common-external-mapped-volume-id',
                    sizeClass: 'sixteenth',
                    sortField: 'mappedLdevId',
                    getDisplayValue: function(item) {
                        return item.mappedVolumeId;
                    }
                }
            ];
            if(dataModel.ddmEnabled !== true) {
                dataModel.addAction = function () {
                    ShareDataService.isAddExtVolume = true;
                    $location.path(['storage-systems', dataModel.storageSystemId, 'external-volumes', 'add'].join('/'));
                };
            }
        };

        var hostGridSettings = function(dataModel) {

            dataModel.gridSettings = [
                {
                    title: 'hosts-id',
                    sizeClass: 'twelfth',
                    sortField: 'serverId',
                    getDisplayValue: function (item) {
                        return item.serverId;
                    },
                    type: 'id'

                },
                {
                    title: 'hosts-label',
                    sizeClass: 'sixth',
                    sortField: 'serverName',
                    getDisplayValue: function (item) {
                        return item.serverName;
                    }

                },
                {
                    title: 'hosts-ip-address',
                    sizeClass: 'sixth',
                    sortField: 'ipAddress',
                    getDisplayValue: function (item) {
                        return item.ipAddress;
                    }

                },
                {
                    title: 'hosts-volume-count',
                    sizeClass: 'sixth',
                    sortField: 'attachedVolumeCount',
                    getDisplayValue: function (item) {
                        return item.attachedVolumeCount;
                    }

                },
                {
                    title: 'hosts-data-protection-type',
                    sizeClass: 'sixth',
                    sortField: 'displayedDpType',
                    getDisplayValue: function (item) {
                        return _.map(item.dataProtectionSummary.replicationType, function(elem){
                            return replicationService.displayReplicationType(elem);
                        }).join(', ');
                    },
                    getToolTipValue: function (item) {
                        return _.map(item.dataProtectionSummary.replicationType, function(elem){
                            return replicationService.tooltip(elem);
                        }).join(', ');
                    },
                    type: 'dpType'
                }
            ];
        };

        var poolGridSettings = function (dataModel) {
            dataModel.gridSettings = [
                {
                    title: 'ID',
                    sizeClass: 'eighteenth',
                    sortField: 'storagePoolId',
                    getDisplayValue: function (item) {
                        return item.storagePoolId;
                    },
                    type: 'id'

                },
                {
                    title: 'Name',
                    sizeClass: 'sixth',
                    sortField: 'label',
                    getDisplayValue: function (item) {
                        return item.label;
                    }

                },
                {
                    title: 'Type',
                    sizeClass: 'eighteenth',
                    sortField: 'type',
                    getDisplayValue: function (item) {
                        return synchronousTranslateService.translate(item.type);
                    }

                },
                {
                    title: 'pool-active-flash',
                    sizeClass: 'eighteenth',
                    sortField: 'activeFlashEnabled',
                    getDisplayValue: function (item) {
                        return item.activeFlashEnabled ? 'pool-active-flash' : '';
                    },
                    getIconClass: function (item) {
                        return item.activeFlashEnabled ? 'icon-checkmark' : '';
                    },
                    type: 'icon'
                },
                {
                    title: 'common-label-total',
                    sizeClass: 'twelfth',

                    sortField: 'capacityInBytes.value',
                    getDisplayValue: function (item) {
                        return item.capacityInBytes;
                    },
                    type: 'size'

                },
                {
                    title: 'common-label-free',
                    sizeClass: 'twelfth',
                    sortField: 'availableCapacityInBytes.value',
                    getDisplayValue: function (item) {
                        return item.availableCapacityInBytes;
                    },
                    type: 'size'

                },
                {
                    title: 'common-label-used',
                    sizeClass: 'twelfth',
                    sortField: 'usedCapacityInBytes.value',
                    getDisplayValue: function (item) {
                        return item.usedCapacityInBytes;
                    },
                    type: 'size'

                }
            ];
        };

        return {
            setVolumesGridSettings: function(dataModel, options) {
                volumeGridSettings(dataModel, options);
            },
            setHostGridSettings: function(dataModel) {
                hostGridSettings(dataModel);
            },
            setPoolGridSettings: function(dataModel) {
                poolGridSettings(dataModel);
            },
            setExternalVolumeGridSettings: externalVolumeGridSettings
        };
    });
