'use strict';

/**
 * @ngdoc service
 * @name rainierApp.volumeCapabilitiesService
 * @description
 * # volumeCapabilitiesService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('volumeCapabilitiesService', function (constantService, versionService) {
        return {
            getValidVolumeLabelInfo: function (storageSystemModel, firmwareVersion) {
                if (constantService.isHM850Series(storageSystemModel) &&
                    versionService.isEqualOrGreaterVersion(
                        versionService.firmwareVersionPrefix.SVOS830_HM850, firmwareVersion)) {
                    return {
                        pattern: /^[ a-zA-Z0-9_.@\-\\!#$%&'()+,/:=\[\]^`{}~]+$/,
                        errMessageKey: 'invalid-volume-label-for-hm850-svos8.3'
                    };
                }

                return {
                    pattern: /^[a-zA-Z0-9_.@]([a-zA-Z0-9-_.@]*$|[ a-zA-Z0-9-_.@]*[a-zA-Z0-9-_.@]+$)/,
                    errMessageKey: 'invalid-volume-label'
                };
            }
        }
    });
