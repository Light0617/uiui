


'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:EvsAddCtrl
 * @description
 * # EvsAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('EvsAddCtrl', function($scope, $routeParams, orchestratorService, fileSystemService, $timeout, subnetMaskService, paginationService, objectTransformService, validateIpService) {

        var storageSystemId = $routeParams.storageSystemId;
        var GET_STORAGE_SYSTEM_PATH = 'storage-systems';
        var selectable;
        var storageSystem;
        var storageSystems;

        function validRange(range) {
            if(range > 0 && range < 129) {
                $scope.dataModel.validRange = true;
            }
        }

        paginationService.getAllPromises(null, GET_STORAGE_SYSTEM_PATH, true, null, objectTransformService.transformStorageSystem).then(function (result) {
            storageSystems = _.reject(result, function (storageSystem) { return !storageSystem.accessible || !storageSystem.unified; });
            selectable = _.isUndefined(storageSystemId);
            if(selectable) {
                storageSystemId = _.first(storageSystems).storageSystemId;
            }
            storageSystem = _.find(storageSystems, function (s) {
                return s.storageSystemId === storageSystemId;
            });
            var dataModel = {
                validationForm: {
                    label: '',
                    ipAddress: '',
                    subnetMask: '',
                    port: '',
                    storageSystemId: storageSystemId
                },
                validIp: true,
                validPort: true,
                subnetMasks: subnetMaskService.getSubnetMasks(),
                storageSystems: storageSystems,
                storageSystem: storageSystem,
                storageSystemSelectable: selectable,
                storageSystemId: storageSystemId,
                payload: {
                    name: '',
                    ipAddress: '',
                    storageSystemId: '',
                    subnetMask: '',
                    port: '',
                    ipv6: ''
                }

            };

            $scope.dataModel = dataModel;

            $scope.$watch('dataModel.payload.ipAddress', function () {
                var splitIp = $scope.dataModel.payload.ipAddress.split('/');
                $scope.dataModel.validRange = true;
                $scope.dataModel.validIp = true;
                if(validateIpService.isIPv4($scope.dataModel.payload.ipAddress)){
                    $scope.dataModel.payload.ipv6 = false;
                }
                else if(validateIpService.isIPv6(_.first(splitIp))) {
                    $scope.dataModel.payload.ipv6 = true;
                    $scope.dataModel.payload.subnetMask = '';
                    $scope.dataModel.validRange = false;
                    if(splitIp.length === 2) {
                        validRange(_.last(splitIp));
                    }
                }
                else {
                    $scope.dataModel.validIp = false;
                }
            });

            function setDropDownVisibility() {
                $scope.dataModel.showDropDownColumn = true;
            }

            $scope.$watch('dataModel.storageSystem', function () {
                $scope.dataModel.showDropDownColumn = false;
                $timeout(setDropDownVisibility, 500);
                orchestratorService.ethernetInterfaces($scope.dataModel.storageSystem.storageSystemId).then(function (result) {
                    $scope.dataModel.ports = _.map(_.reject(result.ethernetInterfaceResourceList, function(ethernetInterface) { return ethernetInterface.name.indexOf('ag') !== 0; }), function (ethernetInterface) { return ethernetInterface.name; });
                    $scope.dataModel.port = '';

                });
            });

            $scope.dataModel.canSubmit = function () {
                return $scope.dataModel.validationForm.label.$valid && $scope.dataModel.validationForm.ipAddress.$valid &&
                    ($scope.dataModel.payload.subnetMask || $scope.dataModel.payload.ipv6) && $scope.dataModel.payload.port && $scope.dataModel.storageSystem;
            };

            $scope.dataModel.submit = function () {
                $scope.dataModel.payload.storageSystemId = $scope.dataModel.storageSystem.storageSystemId;
                orchestratorService.addEvs($scope.dataModel.payload).then(function () {
                    window.history.back();
                });
            };
        });
    });
