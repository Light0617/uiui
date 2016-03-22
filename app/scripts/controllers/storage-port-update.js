'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:PortUpdateCtrl
 * @description
 * # PortUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('PortUpdateCtrl', function ($scope, $routeParams, orchestratorService, ShareDataService) {
        var storageSystemId = $routeParams.storageSystemId;
        var storageSystemModel = ShareDataService.storageSystemModel;
        var storagePort = ShareDataService.editStoragePort;

        $scope.dataModel = {
            storagePortId: storagePort.storagePortId,
            storagePortSpeed: storagePort.speed,
            storagePortType: storagePort.type,
            storagePortFabric: storagePort.fabric,
            storagePortConnectionType: storagePort.connectionType,
            storagePortSecurity: storagePort.securitySwitchEnabled,
            storagePortAttribute: storagePort.attributes[0],
            portAttributes: ['Target', 'RCU Target', 'Initiator', 'External']
        };

        $scope.updateStoragePort = function() {
            orchestratorService.updateStoragePort(storageSystemId, storagePort.storagePortId, buildUpdatePortPayload());
            window.history.back();
        };

        function buildUpdatePortPayload() {
            var updatePortPayload = {};
            updatePortPayload.securitySwitchEnabled = $scope.dataModel.storagePortSecurity;
            if ($scope.isStorageModelG1000()) {
                if ($scope.dataModel.storagePortAttribute === 'Target') {
                    updatePortPayload.attribute = 'TARGET_PORT';
                } else if ($scope.dataModel.storagePortAttribute === 'Initiator') {
                    updatePortPayload.attribute = 'MCU_INITIATOR_PORT';
                } else if ($scope.dataModel.storagePortAttribute === 'RCU Target') {
                    updatePortPayload.attribute = 'RCU_TARGET_PORT';
                } else if ($scope.dataModel.storagePortAttribute === 'External') {
                    updatePortPayload.attribute = 'EXTERNAL_INITIATOR_PORT';
                }
            }
            return updatePortPayload;
        }

        $scope.isNullAttribute = function() {
            return _.isNull($scope.dataModel.storagePortAttribute);
        };

        $scope.isStorageModelG1000 = function() {
            return storageSystemModel === 'VSP G1000';
        };
    });
