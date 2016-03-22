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
                svpIpAddress: result.svpIpAddress,
                gum1IpAddress: result.gum1IpAddress,
                gum2IpAddress: result.gum2IpAddress ,
                username: '',
                password: ''
            };
            $scope.dataModel = dataModel;
        });

        $scope.isValid = function () {
            return  (isNotBlank($scope.dataModel.username) && isNotBlank($scope.dataModel.password));
        };

        $scope.updateStorageSystem = function() {
            var updateStorageSystemsPayload = buildUpdateStorageSystemsPayload();
            orchestratorService.updateStorageSystem($scope.dataModel.storageSystemId, updateStorageSystemsPayload);
            window.history.back();
        };

        function buildUpdateStorageSystemsPayload() {
            var updateStorageSystemsPayload = {
                username: $scope.dataModel.username,
                password: $scope.dataModel.password
            };
            return updateStorageSystemsPayload;
        }

        function isNotBlank(inputString) {
            return (inputString !== undefined && inputString !== null && inputString.length > 0);
        }

    });
