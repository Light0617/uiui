'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumesAddCtrl
 * @description
 * # StorageSystemVolumesAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FileSystemsAddCtrl', function ($scope, $routeParams, fileSystemService, $timeout, $window, $filter, orchestratorService,
                                                diskSizeService, objectTransformService, synchronousTranslateService, paginationService, validateIpService) {
        var storageSystemId = $routeParams.storageSystemId;
        var GET_STORAGE_SYSTEM_PATH = 'storage-systems';
        var evsId = $routeParams.evsId;
        var filePoolId = $routeParams.filePoolId;
        var storageSystems = [storageSystemId];
        var filePools;

        var ports = fileSystemService.getVirtualFileServerPorts();
        paginationService.getAllPromises(null, GET_STORAGE_SYSTEM_PATH, true, null, objectTransformService.transformStorageSystem).then(function (result) {
            if(!storageSystemId) {
                storageSystems = _.reject(result, function (storageSystem) { return !storageSystem.accessible || !storageSystem.unified; });
            }
            return orchestratorService.filePools(storageSystemId);
        }).then(function (pools) {
            filePools = _.sortBy(pools.filePools, function(filePool) { return filePool.freeCapacity; });
            return orchestratorService.enterpriseVirtualServers(storageSystemId);
        }).then(function (virtualFileServers) {
            var dataModel = {
                validCapacity: true,
                whiteSpace: false,
                maxCapacity: false,
                validationForm: {
                    label: '',
                    capacity: '',
                    ipAddress: '',
                    subnetMask: '',
                    fileServerName: ''
                }
            };

            $scope.dataModel = dataModel;
            $scope.dataModel.allFilePools = filePools;
            $scope.dataModel.filePools = filePools;
            $scope.dataModel.virtualFileServers = virtualFileServers.evses;
            if(filePoolId) {
                var filePool = _.find(filePools, function (fp) { return fp.id === filePoolId; });
                if(filePool) {
                    $scope.dataModel.defaultFilePool = true;
                    $scope.dataModel.filePool = filePool;
                    $scope.dataModel.filePools = [filePool];
                }
            }
            else if(evsId) {
                var evs = _.find(virtualFileServers.evses, function (evs) { return evs.uuid === evsId; });
                if(evs) {
                    $scope.dataModel.defaultEvs = true;
                    $scope.dataModel.virtualFileServer = evs.id;
                    $scope.dataModel.virtualFileServers = [evs];
                }
            }
            var formats = fileSystemService.getFormats();
            var units = fileSystemService.getUnits();
            $scope.dataModel.selectedStorageSystem = storageSystemId;
            $scope.dataModel.storageSystems = storageSystems;
            $scope.dataModel.formats = formats;
            $scope.dataModel.units = units;
            $scope.dataModel.unit = units[0];
            $scope.dataModel.ports = ports;
            $scope.dataModel.subnetPattern = validateIpService.getSubnetRegExp();
            $scope.dataModel.selectedPattern = validateIpService.getIPRegExp();

            $scope.dataModel.submit = function () {
            var payload;
            if($scope.dataModel.virtualFileServer === 'new') {
                payload = {
                    'label': $scope.dataModel.label,
                    'filePoolId': $scope.dataModel.filePool.id,
                    'capacity': diskSizeService.createDisplaySize($scope.dataModel.capacity, $scope.dataModel.unit).value.toString(),
                    'blockSize': fileSystemService.getFormatInKiloBytes($scope.dataModel.format),
                    'evsId': $scope.dataModel.virtualFileServer,
                    'createNewEvs': true,
                    'createEVSParams': {
                        'evsName': $scope.dataModel.virtualFileServerName,
                        'ipAddress': $scope.dataModel.ipAddress,
                        'subnetMask': $scope.dataModel.subnetMask,
                        'port': $scope.dataModel.port
                    }
                };
            }
            else{

                payload = {
                    'label': $scope.dataModel.label,
                    'filePoolId': $scope.dataModel.filePool.id,
                    'capacity': diskSizeService.createDisplaySize($scope.dataModel.capacity, $scope.dataModel.unit).value.toString(),
                    'blockSize': fileSystemService.getFormatInKiloBytes($scope.dataModel.format),
                    'evsId': $scope.dataModel.virtualFileServer,
                    'createNewEvs': false
                };
            }
            orchestratorService.createFileSystem($scope.dataModel.selectedStorageSystem, payload).then(function () {
                window.history.back();
             });
            };

            $scope.dataModel.canSubmit = function () {
                return $scope.dataModel.format && $scope.dataModel.filePool && $scope.dataModel.validationForm.label.$valid &&
                    $scope.dataModel.virtualFileServer && $scope.dataModel.validationForm.capacity.$valid && !$scope.dataModel.whiteSpace &&
                    isVirtualFileServerParamsValid() && $scope.dataModel.validCapacity && !$scope.dataModel.maxCapacity;
            };

            $scope.$watch('dataModel.ipAddress', function () {
                if(validateIpService.isIPv4($scope.dataModel.ipAddress)){
                    $scope.dataModel.ipv6 = false;
                }
                else{
                    $scope.dataModel.ipv6 = true;
                    $scope.dataModel.subnetMask = '';
                }
            });

            $scope.$watch('dataModel.label', function () {
                if ($scope.dataModel.label) {
                    $scope.dataModel.whiteSpace = $scope.dataModel.label.indexOf(' ') > -1;
                }
            });

            function setDropDownVisibility() {
                $scope.dataModel.showDropDownColumn = true;
            }

            $scope.$watchGroup(['dataModel.filePool', 'dataModel.capacity', 'dataModel.unit'], function () {
                var selectedCapacity = diskSizeService.createDisplaySize($scope.dataModel.capacity, $scope.dataModel.unit);

                if(!filePoolId) {
                    $scope.dataModel.showDropDownColumn = false;
                    $timeout(setDropDownVisibility, 500);
                    $scope.dataModel.filePools = _.sortBy(_.filter($scope.dataModel.allFilePools, function (filePool) {
                            return parseInt(filePool.freeCapacity) > selectedCapacity.value;
                        }),
                        function (filePool) {
                            return parseInt(filePool.freeCapacity) * -1;
                        });
                    $scope.dataModel.filePool = _.find($scope.dataModel.filePools, function (fp) {
                        if (!$scope.dataModel.filePool) {
                            return false;
                        }
                        return fp.id === $scope.dataModel.filePool.id;
                    });
                }
                if($scope.dataModel.filePool && selectedCapacity) {
                    $scope.dataModel.validCapacity = parseInt($scope.dataModel.filePool.freeCapacity) > selectedCapacity.value;
                    var summaryModel = objectTransformService.transformFilePoolCapacitySummaryModel($scope.dataModel.filePool, $scope.dataModel.capacity, $scope.dataModel.unit);
                    summaryModel.title = synchronousTranslateService.translate('common-storage-systems');
                    summaryModel.noBreakdown = true;
                    summaryModel.noLegendBox = true;
                    $scope.dataModel.keyAndColors = fileSystemService.getKeyAndColors($scope.dataModel.filePool, $scope.dataModel.capacity, $scope.dataModel.unit);
                    $scope.dataModel.summaryModel = summaryModel;
                }
            }, true);

            function isVirtualFileServerParamsValid(){
                if($scope.dataModel.virtualFileServer === 'new'){
                    return $scope.dataModel.port && $scope.dataModel.selectedStorageSystem && $scope.dataModel.validationForm.ipAddress.$valid &&
                        ($scope.dataModel.validationForm.subnetMask.$valid || $scope.dataModel.ipv6) && $scope.dataModel.validationForm.fileServerName.$valid;
                }
                return true;
            }
        });


    });
