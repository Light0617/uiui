'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumesUpdateCtrl
 * @description
 * # StorageSystemVolumesUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemVolumeUpdateCtrl', function ($scope, $routeParams, orchestratorService, diskSizeService, volumeService) {

        var storageSystemId = $routeParams.storageSystemId;

        orchestratorService.volume(storageSystemId, $routeParams.volumeId).then(function (result) {

            var dataModel = result;

            orchestratorService.storagePool(storageSystemId, dataModel.storagePoolId).then(function (result) {
                dataModel.belongsPoolType = result.type;

                var updatedModel = angular.copy(dataModel);

                updatedModel.submit = function () {
                    var updateVolumePayload = buildUpdateVolumePayload(dataModel, updatedModel);
                    orchestratorService.updateVolume(
                        updatedModel.storageSystemId,
                        updatedModel.volumeId,
                        updateVolumePayload).then(function () {
                            window.history.back();
                        });
                };

                updatedModel.canSubmit = function () {

                    // Modify the label from valid string to empty string or null is not allowed.
                    if (dataModel.label && dataModel.label.length > 0 && (updatedModel.label===null || updatedModel.label.length === 0)){
                        return false;
                    }
                    var newSize = diskSizeService.createDisplaySize(updatedModel.totalCapacity.decimalSize, updatedModel.totalCapacity.unit).value;
                    var oldSize = diskSizeService.createDisplaySize(dataModel.totalCapacity.decimalSize, dataModel.totalCapacity.unit).value;
                    return newSize > oldSize
                        || dataModel.label !== updatedModel.label
                        || dataModel.dataSavingTypeValuePair.value !== updatedModel.dataSavingTypeValuePair.value;
                };

                dataModel.updateModel = updatedModel;
                dataModel.labelIsValid = true;
                dataModel.validLabel = function() {
                    if (dataModel.label === updatedModel.label) {
                        dataModel.labelIsValid = true;
                    } else {
                        dataModel.labelIsValid = volumeService.validateCombinedLabel(updatedModel.label, null, 1);
                    }
                };
                $scope.dataModel = dataModel;
            });
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
                payload.dkcDataSavingType = updatedVolume.dataSavingTypeValuePair.value
            }

            return payload;
        }
    });
