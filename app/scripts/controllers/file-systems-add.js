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
                                                diskSizeService, objectTransformService, synchronousTranslateService, paginationService) {
        var storageSystemId = $routeParams.storageSystemId;
        var GET_STORAGE_SYSTEM_PATH = 'storage-systems';
        var evsId = $routeParams.evsId;
        var filePoolId = $routeParams.filePoolId;
        var storageSystems = [storageSystemId];
        var filePools;
        var ipv4 = /^((([01]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))[.]){3}(([0-1]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))$/;

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
            if(!filePoolId && filePools.length > 0) {
                $scope.dataModel.filePool = _.last(filePools);
            }
            //TODO: Will activate once auto selected is supported
            //var autoSelectedFilePool = fileSystemService.autoSelectFilePool($scope.dataModel.filePools);
            //autoSelectedFilePool.label = synchronousTranslateService.translate('common-auto-selected');
            //$scope.dataModel.filePools.unshift(autoSelectedFilePool);
            var formats = fileSystemService.getFormats();
            var units = fileSystemService.getUnits();
            //var storagePoolMapping = fileSystemService.getStoragePoolMapping(storageSystemId, $scope.dataModel.filePools);
            $scope.dataModel.selectedStorageSystem = storageSystemId;
            $scope.dataModel.storageSystems = storageSystems;
            $scope.dataModel.formats = formats;
            $scope.dataModel.units = units;
            $scope.dataModel.unit = units[0];

            //$scope.dataModel.poolTiers = _.keys(storagePoolMapping);
            //TODO: EL Remove when poolTier is fixed
            $scope.dataModel.poolTier = '1';
            $scope.dataModel.ports = ports;
            $scope.dataModel.subnetPattern = /^(255.)((([01]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))[.]){2}(([0-1]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))$/;
            $scope.dataModel.selectedPattern = /(^\s*((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$)/;

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

            //TODO: EL Need to fix
            $scope.$watch('dataModel.poolTier', function () {
                $scope.dataModel.showDropDownColumn = false;

                //$scope.dataModel.filePools = storagePoolMapping[$scope.dataModel.poolTier];
                $timeout(setDropDownVisibility,500);
                $scope.dataModel.showDropDownColumn = true;
            }, true);

            $scope.$watch('dataModel.ipAddress', function () {
                if(ipv4.test($scope.dataModel.ipAddress)){
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
                    $scope.dataModel.validCapacity = parseInt($scope.dataModel.filePool.freeCapacity) - parseInt($scope.dataModel.filePool.usedCapacity) > selectedCapacity.value;
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
