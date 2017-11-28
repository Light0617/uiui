'use strict';

/**
 * @ngdoc service
 * @name rainierApp.storageSystemCapabilitiesService
 * @description
 * # storageSystemCapabilitiesService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('storageSystemCapabilitiesService', function (dataProtectionCapabilitiesService) {

        return {
            supportSnapshotPoolType: function (storageSystemModel, firmwareVersion) {
                return dataProtectionCapabilitiesService.supportSnapshotPoolType(storageSystemModel, firmwareVersion);
            }
        }
    });
