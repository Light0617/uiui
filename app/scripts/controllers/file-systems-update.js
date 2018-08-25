'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:FileSystemsUpdateCtrl
 * @description
 * # FileSystemsUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FileSystemsUpdateCtrl', function ($scope, $routeParams, fileSystemService, $timeout, $window, $filter, orchestratorService,
                                                diskSizeService, objectTransformService, synchronousTranslateService) {
        var storageSystemId = $routeParams.storageSystemId;
        var fileSystemId = $routeParams.fileSystemId;
        var filePools;
        var fileSystem;

        orchestratorService.fileSystem(storageSystemId, fileSystemId).then(function (fs) {
            fileSystem = fs;
            return orchestratorService.filePool(storageSystemId, fs.filePoolId.toString());
        }).then(function(pool){
            filePools = [pool];
            return orchestratorService.enterpriseVirtualServers(storageSystemId);
        }).then(function (virtualFileServers) {
            var dataModel = {
                validCapacity: true,
                whiteSpace: false,
                maxCapacity: false,
                validationForm: {
                    label: '',
                    capacity: ''
                }
            };
            $scope.dataModel = dataModel;
            dataModel = $scope.dataModel;
            var formats = fileSystemService.getFormats();
            var units = fileSystemService.getUnits();

            //TODO: EL add when tiers are added
            //var storagePoolMapping = fileSystemService.getStoragePoolMapping(storageSystemId, dataModel.filePools);
            var filePool = _.find(filePools, function(fp){ return fp.id === fileSystem.filePoolId;});
            dataModel.filePools = filePools;
            dataModel.virtualFileServers = virtualFileServers.evses;
            dataModel.selectedStorageSystem = storageSystemId;
            dataModel.label = fileSystem.label;
            dataModel.formats = formats;
            dataModel.format = fileSystemService.getFormatLabel(fileSystem.blockSize.value);
            dataModel.units = units;
            dataModel.unit = fileSystem.expansionLimitInBytes.unit;
            dataModel.capacity = Number(fileSystem.expansionLimitInBytes.size);
            dataModel.virtualFileServer = fileSystem.evsId.toString();
            //dataModel.poolTiers = _.keys(storagePoolMapping);
            dataModel.filePool = filePool;
            //TODO: EL Remove when poolTier is fixed
            dataModel.poolTier = '1';
            dataModel.submit = function () {
                var payload = {
                    'label': $scope.dataModel.label,
                    'expansionLimit': diskSizeService.createDisplaySize(dataModel.capacity, dataModel.unit).value.toString()
                };
                orchestratorService.patchFileSystem(storageSystemId, fileSystemId, payload).then(function () {
                 window.history.back();
                 });
            };
            $scope.$watch('dataModel.label', function () {
                if ($scope.dataModel.label) {
                    $scope.dataModel.whiteSpace = $scope.dataModel.label.indexOf(' ') > -1;
                }
            });
            $scope.$watchGroup(['dataModel.filePool', 'dataModel.capacity', 'dataModel.unit'], function () {
                var selectedCapacity = diskSizeService.createDisplaySize($scope.dataModel.capacity, $scope.dataModel.unit);

                $scope.dataModel.maxCapacity = selectedCapacity.value > 1125899906842624;

                var filePool = _.find($scope.dataModel.filePools, function(fp){
                    if(!$scope.dataModel.filePool){
                        return false;
                    }
                    return fp.id === $scope.dataModel.filePool.id;
                });
                if(filePool) {
                    $scope.dataModel.validCapacity = parseInt($scope.dataModel.filePool.freeCapacity) - parseInt($scope.dataModel.filePool.usedCapacity) > selectedCapacity.value;
                    var summaryModel = objectTransformService.transformFilePoolCapacitySummaryModel(filePool, $scope.dataModel.capacity, $scope.dataModel.unit);
                    summaryModel.title = synchronousTranslateService.translate('common-storage-systems');
                    summaryModel.noBreakdown = true;
                    $scope.dataModel.keyAndColors = fileSystemService.getKeyAndColors(filePool, $scope.dataModel.capacity, $scope.dataModel.unit);
                    $scope.dataModel.summaryModel = summaryModel;
                }
            }, true);

            $scope.dataModel.canSubmit = function () {
                var capacity = diskSizeService.createDisplaySize($scope.dataModel.capacity, $scope.dataModel.unit).value;
                return ($scope.dataModel.validationForm.label.$dirty || $scope.dataModel.validationForm.capacity.$dirty) && !$scope.dataModel.whiteSpace &&
                    ($scope.dataModel.validationForm.label.$valid && $scope.dataModel.validationForm.capacity.$valid) &&
                    parseInt($scope.dataModel.filePool.freeCapacity) > capacity && !$scope.dataModel.maxCapacity;
            };
        });


    });
