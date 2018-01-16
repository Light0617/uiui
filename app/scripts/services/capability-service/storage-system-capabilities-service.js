'use strict';

/**
 * @ngdoc service
 * @name rainierApp.storageSystemCapabilitiesService
 * @description
 * # storageSystemCapabilitiesService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('storageSystemCapabilitiesService', function (dataProtectionCapabilitiesService, constantService) {

        return {
            supportSnapshotPoolType: function (storageSystemModel, firmwareVersion) {
                return dataProtectionCapabilitiesService.supportSnapshotPoolType(storageSystemModel, firmwareVersion);
            },
            integratedSnapshotPoolType: function (storageSystemModel, firmwareVersion) {
                return dataProtectionCapabilitiesService.integratedSnapshotPoolType(storageSystemModel, firmwareVersion);
            },
            editableSubscriptionLimit: function (storageSystemModel) {
                return !constantService.isHM850Series(storageSystemModel);
            },
            addableParityGroup: function (storageSystemModel) {
                return constantService.isRaidSeries(storageSystemModel) === false;
            },
            supportPortAttribute: function(storageSystemModel) {
                return constantService.isR800Series(storageSystemModel);
            }
        }
    });
