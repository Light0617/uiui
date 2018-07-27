'use strict';

/**
 * @ngdoc service
 * @name rainierApp.volumeService
 * @description
 * # volumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('volumeService', function (replicationService, ShareDataService, $q,
    $location, constantService) {

        var getStorageSystems = function (paginationService, objectTransformService, storageSystemId) {
            return paginationService.getAllPromises(null, 'storage-systems', true, null,
                objectTransformService.transformStorageSystem).then(function (result) {
                result = _.filter(result, function (r) {
                    return r.storageSystemId !== storageSystemId;
                });

                if(result.length > 0) {
                    return $q.resolve(result);
                }else{
                    return $q.reject('storage-system-not-found-error');
                }
            });
        };

        var volumeRestoreAction = function (action, selectedVolumes, storageSystemId, storageSystemVolumeService) {

            var volumeId = 0;
            if (selectedVolumes && selectedVolumes.length > 0) {
                volumeId = selectedVolumes[0].volumeId;
            }

            storageSystemVolumeService.getVolumePairsAsPVolWithoutSnapshotFullcopy(null, volumeId,
                storageSystemId).then(function (result) {

                ShareDataService.SVolsList = _.filter(result.resources, function (SVol) {
                    return SVol.primaryVolume && SVol.secondaryVolume;
                });
                ShareDataService.restorePrimaryVolumeId = volumeId;
                ShareDataService.restorePrimaryVolumeToken = result.nextToken;

                _.forEach(ShareDataService.SVolsList, function (volume) {
                    volume.selected = false;
                });
                $location.path(['/storage-systems/', storageSystemId, '/volumes/volume-actions-restore-selection'].join(''));
            });
        };

        var volumeUnprotectActions = function (selectedVolume, storageSystemId) {
            ShareDataService.volumeListForUnprotect = selectedVolume;

            $location.path(['storage-systems', storageSystemId, 'volumes', 'unprotect'].join('/'));
        };

        var hasGadVolume = function (selectedVolumes) {
            return _.find(selectedVolumes, function (volume) {
                return volume.isGadVolume();
            }) !== undefined;
        };

        var hasShredding = function (selectedVolumes) {
            return _.some(selectedVolumes, function (vol) {
                return vol.isShredding();
            });
        };

        var enableToShred = function (volume) {
            return volume.isUnattached() &&
                (volume.isNormal() || volume.status === constantService.volumeStatus.BLOCKED) &&
                volume.capacitySavingType === 'No' &&
                !volume.isSnapshotPair() &&
                volume.dataProtectionSummary.replicationType.indexOf('CLONE') === -1 &&
                volume.migrationSummary.migrationType !== constantService.migrationType.MIGRATION;
        };

        var detachFromTargetStorageDialogSettings = function () {
            var dialogSettings = {
                id: 'detachFromTargetStorageConfirmation',
                title: 'storage-volume-detach-from-target',
                content: 'storage-volume-detach-from-target-content',
                disableRadioButton: true,
                itemAttributes: [],
                itemAttribute: {}
            };

            return dialogSettings;
        };

        return {
            getStorageSystems: getStorageSystems,
            volumeRestoreAction: volumeRestoreAction,
            volumeUnprotectActions: volumeUnprotectActions,
            hasGadVolume: hasGadVolume,
            hasShredding: hasShredding,
            enableToShred: enableToShred,
            detachFromTargetStorageDialogSettings: detachFromTargetStorageDialogSettings,
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
