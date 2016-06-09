'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemsUpdateCtrl
 * @description
 * # StorageSystemsUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemsUpdateCtrl', function ($scope, $routeParams, orchestratorService) {
        var storageSystemId = $routeParams.storageSystemId;

        var dataModel = {
        };

        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            dataModel = {
                storageSystemId: result.storageSystemId,
                originalStorageSystemName: result.storageSystemName,
                storageSystemName: result.storageSystemName,
                svpIpAddress: result.svpIpAddress,
                gum1IpAddress: result.gum1IpAddress,
                gum2IpAddress: result.gum2IpAddress ,
                username: '',
                password: ''
            };
            $scope.dataModel = dataModel;
        });

        $scope.isValid = function () {
            // To modify the storage system name from valid string to empty string or null is not allowed.
            if (!isBlank($scope.dataModel.originalStorageSystemName) && isBlank($scope.dataModel.storageSystemName)) {
                return false;
            }

            if ($scope.dataModel.storageSystemName === $scope.dataModel.originalStorageSystemName) {
                return (!isBlank($scope.dataModel.username) && !isBlank($scope.dataModel.password));
            } else {
                return (isBlank($scope.dataModel.username) && isBlank($scope.dataModel.password)) || (!isBlank($scope.dataModel.username) && !isBlank($scope.dataModel.password));
            }
        };

        $scope.updateStorageSystem = function() {
            var updateStorageSystemsPayload = buildUpdateStorageSystemsPayload();
            orchestratorService.updateStorageSystem($scope.dataModel.storageSystemId, updateStorageSystemsPayload);
            window.history.back();
        };

        function buildUpdateStorageSystemsPayload() {
            var updateStorageSystemsPayload = {
                username: isBlank($scope.dataModel.username) ? null : $scope.dataModel.username,
                password: isBlank($scope.dataModel.password) ? null : $scope.dataModel.password,
                storageSystemName: ($scope.dataModel.storageSystemName === $scope.dataModel.originalStorageSystemName) ? null : $scope.dataModel.storageSystemName
            };
            return updateStorageSystemsPayload;
        }

        function isBlank(inputString) {
            return (inputString === undefined || inputString === null || inputString.length === 0);
        }

    });
