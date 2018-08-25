'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:FabricUpdateCtrl
 * @description
 * # FabricUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FabricUpdateCtrl', function ($scope, orchestratorService, ShareDataService) {
        var fabric = ShareDataService.editFabricSwitch;

        $scope.dataModel = {
            updatedSanFabricId: fabric.sanFabricId,
            updatedVirtualFabricId: fabric.virtualFabricId,
            updatedPrincipalSwitchAddress: fabric.principalSwitchAddress,
            updatedSwitchType: fabric.switchType,
            updatedPrincipalSwitchPortNumber: fabric.principalSwitchPortNumber.toString(),
            updatedPrincipalSwitchUsername: fabric.principalSwitchUsername,
            updatedPrincipalSwitchPassword: '',

            isValid: function () {
                return !_.isEmpty(this.updatedPrincipalSwitchAddress) && !_.isEmpty(this.updatedPrincipalSwitchPortNumber) && !_.isEmpty(this.updatedPrincipalSwitchUsername) && !_.isEmpty(this.updatedPrincipalSwitchPassword);
            }
        };

        $scope.updateFabricSwitch = function() {
            orchestratorService.updateFabric(fabric.sanFabricId, buildUpdateFabricPayload());
            window.history.back();
        };

        function buildUpdateFabricPayload() {
            var updateFabricPayload = {};
            updateFabricPayload.virtualFabricId = $scope.dataModel.updatedVirtualFabricId;
            updateFabricPayload.principalSwitchAddress = $scope.dataModel.updatedPrincipalSwitchAddress;
            updateFabricPayload.principalSwitchUsername = $scope.dataModel.updatedPrincipalSwitchUsername;
            updateFabricPayload.principalSwitchPassword = $scope.dataModel.updatedPrincipalSwitchPassword;
            updateFabricPayload.principalSwitchPortNumber = parseInt($scope.dataModel.updatedPrincipalSwitchPortNumber);
            return updateFabricPayload;
        }
    });
