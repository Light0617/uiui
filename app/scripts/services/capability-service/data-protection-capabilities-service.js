'use strict';

/**
 * @ngdoc service
 * @name rainierApp.dataProtectionCapabilitiesService
 * @description
 * # dataProtectionCapabilitiesService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('dataProtectionCapabilitiesService', function (constantService, versionService) {
        return {
            supportSnapshotPoolType: function (storageSystemModel, firmwareVersion) {
                if (constantService.isHM800Series(storageSystemModel)) {
                    if (versionService.isEqualOrGreaterVersion(versionService.firmwareVersionPrefix.SVOS720_HM800, firmwareVersion)) {
                        return [constantService.poolType.HTI, constantService.poolType.HDP];
                    }
                    return [constantService.poolType.HTI];
                }
                else if (constantService.isR800Series(storageSystemModel)) {
                    if (versionService.isEqualOrGreaterVersion(versionService.firmwareVersionPrefix.SVOS720_R800, firmwareVersion)) {
                        return [constantService.poolType.HTI, constantService.poolType.HDP];
                    }
                    return [constantService.poolType.HTI];
                }
                return [constantService.poolType.HTI, constantService.poolType.HDP];
            }
        }
    });
