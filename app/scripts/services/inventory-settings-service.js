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
        $location) {

        var volumeGridSettings = function(dataModel, options) {

            options = angular.extend({
                canAdd: true
            }, options);
            


            dataModel.gridSettings = [{
                title: 'ID',
                sizeClass: 'twelfth',
                sortField: 'volumeId',
                getDisplayValue: function(item) {
                    return item.volumeId;
                },
                type: 'id'

            }, {
                title: 'storage-systems-serial-number',
                sizeClass: 'twelfth',
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
                sizeClass: 'sixth',
                sortField: 'dataProtectionSummary.replicationType',
                getDisplayValue: function(item) {
                    return item.displayedDpType;
                }

            }, {
                title: 'data-protection-status',
                sizeClass: 'sixth',
                sortField: 'dataProtectionSummary.hasFailures',
                getDisplayValue: function(item) {
                    return item.dpMonitoringStatus;
                }

            }, {
                title: 'common-label-total',
                sizeClass: 'twelfth',

                sortField: 'size',
                getDisplayValue: function(item) {
                    return item.totalCapacity;
                },
                type: 'size'

            }, {
                title: 'common-label-free',
                sizeClass: 'twelfth',
                sortField: 'availableCapacity',
                getDisplayValue: function(item) {
                    return item.availableCapacity;
                },
                type: 'size'

            }, {
                title: 'common-label-used',
                sizeClass: 'twelfth',
                sortField: 'usedCapacity',
                getDisplayValue: function(item) {
                    return item.usedCapacity;
                },
                type: 'size'

            }];

            if (options.canAdd) {
                dataModel.addAction = function() {
                    $location.path(['storage-systems', dataModel.storageSystemId, 'volumes', 'add'].join('/'));
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
                        return item.displayedDpType;
                    }

                }
            ];
        };

        return {
            setVolumesGridSettings: function(dataModel, options) {
                volumeGridSettings(dataModel, options);
            },
            setHostGridSettings: function(dataModel) {
                hostGridSettings(dataModel);
            }
        };
    });
