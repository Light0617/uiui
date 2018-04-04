'use strict';

/**
 * @ngdoc service
 * @name rainierApp.parityGroupService
 * @description
 * # parityGroupService
 * Provider in the rainierApp.
 */

angular.module('rainierApp').factory('parityGroupService', function (utilService) {
    var diskBaseEncryptType = ['FMD HDE'];

    return {
        isAvailableEncryptionStatus: function (parityGroup) {
            if (utilService.isNullOrUndef(parityGroup) || utilService.isNullOrUndef(parityGroup.diskSpec)) {
                return false;
            } else if (this.isDiskBaseEncryptType(parityGroup.diskSpec.type) && parityGroup.encryption !== true) {
                return false;
            }
            return true;
        },
        isDiskBaseEncryptType: function (diskType) {
            return _.contains(diskBaseEncryptType, diskType);
        }
    };
});
