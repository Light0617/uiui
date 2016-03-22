'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumesUpdateCtrl
 * @description
 * # StorageSystemVolumesUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemVolumeUpdateCtrl', function ($scope, $routeParams, orchestratorService, diskSizeService) {

        var storageSystemId = $routeParams.storageSystemId;

        orchestratorService.volume(storageSystemId, $routeParams.volumeId).then(function (result) {

            var dataModel = result;
            var updatedModel = angular.copy(result);
            var simpleNameRegexp = /^[a-zA-Z0-9_][a-zA-Z0-9-_]*$/;

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
                var newSize = diskSizeService.createDisplaySize(updatedModel.totalCapacity.intSize, updatedModel.totalCapacity.unit).value;
                var oldSize = diskSizeService.createDisplaySize(dataModel.totalCapacity.intSize, dataModel.totalCapacity.unit).value;
                return newSize > oldSize || dataModel.label !== updatedModel.label;
            };

            dataModel.updateModel = updatedModel;
            dataModel.labelIsValid = true;
            dataModel.validLabel = function() {
                if (dataModel.label === updatedModel.label) {
                    dataModel.labelIsValid = true;
                } else {
                    dataModel.labelIsValid = simpleNameRegexp.test(updatedModel.label);
                }
            };
            $scope.dataModel = dataModel;
        });

        function buildUpdateVolumePayload(oldVolume, updatedVolume) {
            var payload = {
                label: (oldVolume.label === updatedVolume.label) ? null : updatedVolume.label
            };

            var newSize = diskSizeService.createDisplaySize(updatedVolume.totalCapacity.intSize, updatedVolume.totalCapacity.unit).value;
            var oldSize = diskSizeService.createDisplaySize(oldVolume.totalCapacity.intSize, oldVolume.totalCapacity.unit).value;
            if (newSize !== oldSize) {
                payload.capacityInBytes = newSize;
            }

            return payload;
        }
    });
