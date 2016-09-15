'use strict';

/**
 * @ngdoc service
 * @name rainierApp.volumeService
 * @description
 * # volumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('volumeService', function (replicationService) {
        return {
            validateCombinedLabel: function (label, suffix, volumeCount) {
                if (label === null && suffix === null) {
                    return true;
                }

                var simpleNameRegexp = /^[a-zA-Z0-9_.@]([a-zA-Z0-9-_.@]*$|[ a-zA-Z0-9-_.@]*[a-zA-Z0-9-_.@]+$)/;
                var largestSuffix;
                if (suffix === null) {
                    largestSuffix = '';
                } else {
                    largestSuffix = suffix + volumeCount - 1;
                }
                var combinedLabel = label + largestSuffix;

                if (combinedLabel === null || combinedLabel === '') {
                    return true;
                } else if (combinedLabel.length > 32) {
                    return false;
                } else {
                    return simpleNameRegexp.test(combinedLabel);
                }
            },
            restorable: function (volume) {
                var type = volume.dataProtectionSummary.replicationType;
                var snapshotFullcopyOnly = type.length === 1 && replicationService.isSnapClone(type[0]);
                return !volume.isUnprotected() && !snapshotFullcopyOnly;
            },
            getDkcDataSavingTypes: function () {
                return [
                    { label: 'volume-capacity-saving-type-filter-compression', value: 'COMPRESSION' },
                    { label: 'volume-capacity-saving-type-filter-deduplication-and-compression', value: 'DEDUPLICATION_AND_COMPRESSION' },
                    { label: 'volume-capacity-saving-type-filter-no', value: 'NONE' }
                ];
            },
            getVolumeSizeUnits: function () {
                return ['GB', 'TB', 'PB'];
            }
        };

    });
