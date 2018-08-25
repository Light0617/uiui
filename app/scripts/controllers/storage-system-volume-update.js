'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumesUpdateCtrl
 * @description
 * # StorageSystemVolumesUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemVolumeUpdateCtrl', function ($scope, $routeParams, orchestratorService, diskSizeService,
                                                           volumeService, resourceTrackerService, createVolumeService,
                                                           volumeCapabilitiesService) {

        var storageSystemId = $routeParams.storageSystemId;
        var volumeId = $routeParams.volumeId;
        var targetStorageSystem;

        orchestratorService.storageSystem(storageSystemId).then(function (storageSystem) {
            targetStorageSystem = storageSystem;
            return orchestratorService.volume(storageSystemId, volumeId);
        }).then(function (result) {

            var dataModel = result;
            dataModel.storageSystem = targetStorageSystem;
            dataModel.belongsPoolType = result.type;
            var poolId = result.poolId;
            var updatedModel = angular.copy(dataModel);
            updatedModel.volumeSizeUnits = volumeService.getVolumeSizeUnits();

            updatedModel.setSizeUnit = function(unit) {
                updatedModel.totalCapacity.unit = unit;
            };

            updatedModel.submit = function () {
                var updateVolumePayload = buildUpdateVolumePayload(dataModel, updatedModel);

                createVolumeService.validatePoolForUpdateVolume(function () {
                    // Build reserved resources
                    var reservedResourcesList = [];
                    reservedResourcesList.push(volumeId + '=' + resourceTrackerService.volume());
                    reservedResourcesList.push(poolId + '=' + resourceTrackerService.storagePool());

                    // Show popup if resource is present in resource tracker else submit
                    resourceTrackerService.showReservedPopUpOrSubmit(
                        reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                        'Update Volume Confirmation', storageSystemId, volumeId, updateVolumePayload,
                        orchestratorService.updateVolume);
                }, storageSystemId, updateVolumePayload.dkcDataSavingType, poolId);
            };

            updatedModel.canSubmit = function () {

                // Modify the label from valid string to empty string or null is not allowed.
                if (dataModel.label && dataModel.label.length > 0 && (updatedModel.label===null || updatedModel.label.length === 0)){
                    return false;
                }
                var newSize = diskSizeService.createDisplaySize(updatedModel.totalCapacity.decimalSize, updatedModel.totalCapacity.unit).value;
                var oldSize = diskSizeService.createDisplaySize(dataModel.totalCapacity.decimalSize, dataModel.totalCapacity.unit).value;
                return newSize > oldSize || dataModel.label !== updatedModel.label || dataModel.dataSavingTypeValuePair.value !== updatedModel.dataSavingTypeValuePair.value;
            };

            dataModel.updateModel = updatedModel;
            dataModel.labelIsValid = true;
            dataModel.validLabel = function() {
                if (dataModel.label === updatedModel.label) {
                    dataModel.labelIsValid = true;
                } else {
                    var validLabelInfo = volumeCapabilitiesService.getValidVolumeLabelInfo(
                        dataModel.storageSystem.model,
                        dataModel.storageSystem.firmwareVersion);

                    dataModel.labelIsValid = volumeService.validateCombinedLabel(updatedModel.label, null, 1,
                        validLabelInfo.pattern);
                    dataModel.invalidVolLabelMessageKey = validLabelInfo.errMessageKey;
                }
            };
            $scope.dataModel = dataModel;
        });

        function buildUpdateVolumePayload(oldVolume, updatedVolume) {
            var payload = {
                label: (oldVolume.label === updatedVolume.label) ? null : updatedVolume.label
            };

            var newSize = diskSizeService.createDisplaySize(updatedVolume.totalCapacity.decimalSize, updatedVolume.totalCapacity.unit).value;
            var oldSize = diskSizeService.createDisplaySize(oldVolume.totalCapacity.decimalSize, oldVolume.totalCapacity.unit).value;
            if (newSize !== oldSize) {
                payload.capacityInBytes = newSize;
            }

            if (oldVolume.dataSavingTypeValuePair.value !== updatedVolume.dataSavingTypeValuePair.value) {
                payload.dkcDataSavingType = updatedVolume.dataSavingTypeValuePair.value;
            }

            return payload;
        }
    });