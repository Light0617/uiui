


'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:EvsUpdateCtrl
 * @description
 * # EvsUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('EvsUpdateCtrl', function($scope, $routeParams, orchestratorService, fileSystemService, paginationService, objectTransformService) {

        var storageSystemId = $routeParams.storageSystemId;
        var GET_STORAGE_SYSTEM_PATH = 'storage-systems';
        var evsId = $routeParams.evsId;
        var storageSystems;

        paginationService.getAllPromises(null, GET_STORAGE_SYSTEM_PATH, true, null, objectTransformService.transformStorageSystem).then(function (result) {
            storageSystems = result;
            return orchestratorService.enterpriseVirtualServer(storageSystemId, evsId);
        }).then(function (virtualFileServer) {
            var selectable = _.isUndefined(storageSystemId);

            var storageSystem = _.find(storageSystems, function (s) {
                return selectable || s.storageSystemId === storageSystemId;
            });

            var dataModel = {
                validationForm: {
                    label: ''
                },
                ports: fileSystemService.getVirtualFileServerPorts(),
                storageSystems: storageSystems,
                storageSystem: storageSystem,
                payload: {
                    name: virtualFileServer.name,
                    ipAddress: _.first(virtualFileServer.interfaceAddresses).ip,
                    storageSystemId: virtualFileServer.storageSystemId,
                    subnetMask: _.first(virtualFileServer.interfaceAddresses).mask,
                    port: _.first(virtualFileServer.interfaceAddresses).port
                }
            };

            $scope.dataModel = dataModel;

            $scope.dataModel.canSubmit = function () {
                return $scope.dataModel.validationForm.label.$valid && $scope.dataModel.validationForm.label.$dirty;
            };

            $scope.dataModel.submit = function () {
                orchestratorService.patchEvs(storageSystemId, evsId, {evsName: $scope.dataModel.payload.name}).then(function () {
                    window.history.back();
                });
            };
        });
    });
