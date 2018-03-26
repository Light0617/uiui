'use strict';

/**
 * @ngdoc service
 * @name rainierApp.dataProtectionCapabilitiesService
 * @description
 * # dataProtectionCapabilitiesService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('dataProtectionCapabilitiesService', function (constantService, versionService, replicationService) {
        return {
            supportSnapshotPoolType: function (storageSystemModel, firmwareVersion) {
                if (this.isSupportDpTiPoolIntegrationVersion(storageSystemModel, firmwareVersion) !== true) {
                    return [constantService.poolType.HTI];
                }
                return [constantService.poolType.HTI, constantService.poolType.HDP];
            },

            integratedSnapshotPoolType: function (storageSystemModel, firmwareVersion) {
                if (this.isSupportDpTiPoolIntegrationVersion(storageSystemModel, firmwareVersion) !== true) {
                    return [];
                }
                return [constantService.poolType.HDP];
            },

            isSupportDpTiPoolIntegrationVersion: function (storageSystemModel, firmwareVersion) {
                if (constantService.isHM800Series(storageSystemModel)) {
                    if (versionService.isEqualOrGreaterVersion(versionService.firmwareVersionPrefix.SVOS720_HM800, firmwareVersion)) {
                        return true;
                    }
                    return false;
                }
                else if (constantService.isR800Series(storageSystemModel)) {
                    if (versionService.isEqualOrGreaterVersion(versionService.firmwareVersionPrefix.SVOS720_Rx00, firmwareVersion)) {
                        return true;
                    }
                    return false;
                }
                return true;
            },

            isSupportSnapOnSnapCreation: function (storageSystemModel, firmwareVersion) {
                if (constantService.isHM800Series(storageSystemModel)) {
                    if (versionService.isEqualOrGreaterVersion(versionService.firmwareVersionPrefix.SVOS710_HM800, firmwareVersion)) {
                        return true;
                    }
                    return false;
                }
                else if (constantService.isR800Series(storageSystemModel)) {
                    if (versionService.isEqualOrGreaterVersion(versionService.firmwareVersionPrefix.SVOS700_Rx00, firmwareVersion)) {
                        return true;
                    }
                    return false;
                }
                return true;
            },

            supportReplicationSnapshotTypes: function (storageSystemModel, firmwareVersion) {
                if (this.isSupportSnapOnSnapCreation(storageSystemModel, firmwareVersion) === false) {
                    return [replicationService.rawTypes.SNAP];
                } else {
                    return [replicationService.rawTypes.SNAP_ON_SNAP, replicationService.rawTypes.SNAP];
                }
            }
        }
    });
