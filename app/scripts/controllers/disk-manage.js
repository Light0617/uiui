'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:DiskManageCtrl
 * @description
 * # DiskManageCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('DiskManageCtrl', function ($scope, $routeParams, $timeout, $window, orchestratorService, diskSizeService, $location,
                                            objectTransformService, paginationService, resourceTrackerService) {
        var storageSystemId = $routeParams.storageSystemId;

        paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result) {

            var storageSystems = result;
            var selectable = _.isUndefined(storageSystemId);

            var storageSystem = _.find(storageSystems, function (s) {
                return selectable || s.storageSystemId === storageSystemId;
            });

            $scope.dataModel = buildDataModel(storageSystems, selectable);

            if (storageSystem) {
                $scope.dataModel.selectedStorageSystemId = storageSystem.storageSystemId;
                paginationService.getAllPromises(null, 'disks', true, storageSystem.storageSystemId, null).then(storageSystemDisksReturns);
            }

            $scope.dataModel.search = {
                freeText: '',
                totalCapacity: {
                    min: 0,
                    max: 1000,
                    unit: 'PB'
                },
                type: null,
                speed: null,
                purpose: null
            };
        });

        function buildDataModel(storageSystems, selectable) {
            var dataModel = {
                storageSystem: _.first(storageSystems),
                storageSystems: storageSystems,
                storageSystemSelectable: selectable,
                isHotSpare: null
            };

            dataModel.checkSubmitDisable = function () {
                var temp = getAllSelectedDisksIds($scope.dataModel.disksList);
                return ($scope.dataModel.search.purpose === null || (temp.length === 0));
            };

            return dataModel;

        }

        $scope.initRaid = function (options) {
            angular.forEach(options, function (value) {
                if (value.isDefault) {
                    return 0;
                }
            });
        };

        function storageSystemDisksReturns(result) {
            var disks = result;
            $scope.dataModel.submitDisabled = true;

            var disksList = [];
            var types = [];
            var speeds = [];

            _.forEach(disks, function (disk) {
                if (disk.purpose === 'FREE' || disk.purpose === 'SPARE') {
                    var storageSystemDisk = {
                        diskId: disk.diskId,
                        storageSystemId: disk.storageSystemId,
                        serialNumber: disk.serialNumber,
                        location: disk.location,
                        model: disk.model,
                        capacityInBytes: disk.capacityInBytes,
                        version: disk.version,
                        speed: disk.speed,
                        type: disk.type,
                        purpose: disk.purpose,
                        parityGroupId: disk.parityGroupId,
                        selected: false,
                        convertedDiskCapacity: diskSizeService.getDisplayPhysicalSize(disk.capacityInBytes),
                        speedOnly: diskSizeService.getDisplaySpeedOnly(disk.speed),
                        speedUnitOnly: diskSizeService.getDisplaySpeedUnitOnly(disk.speed)
                    };

                    types.push(disk.type);
                    speeds.push(disk.speed.toString());
                    disksList.push(storageSystemDisk);
                }
            });

            $scope.dataModel.types = types;
            $scope.dataModel.speeds = speeds;
            $scope.dataModel.disksList = disksList;
            $scope.dataModel.uniqueDiskTypes = _.sortBy(_.uniq(types));
            $scope.dataModel.uniqueDiskSpeeds = _.sortBy(_.uniq(speeds));
        }

        // Post call to the server to create parity groups
        $scope.updateDiskPurpose = function () {
            var reservedResourcesList = [];
            var diskIds = [];
            var disUpdatePayload = buildUpdateDiskPurposePayload();
            _.forEach($scope.dataModel.disksList, function (disk) {
                if ((disk.selected === true) && (disk.purpose === $scope.dataModel.search.purpose)) {
                    // Build reserved resources
                    reservedResourcesList.push(disk.diskId + '=' + resourceTrackerService.disk());
                    diskIds.push(disk.diskId);
                }
            });
            // Show popup if resource is present in resource tracker else submit
            resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                'Update Disk Confirmation', $scope.dataModel.selectedStorageSystemId, diskIds, disUpdatePayload,
                orchestratorService.storageSystemDisksUpdate, null, true);
        };

        // Generates payload for advanced parity group creation based on selected disks
        function buildUpdateDiskPurposePayload() {
            if ($scope.dataModel.search.purpose === 'FREE') {
                $scope.dataModel.isHotSpare = 'Yes';
            } else if ($scope.dataModel.search.purpose === 'SPARE') {
                $scope.dataModel.isHotSpare = 'No';
            }

            var payload = {
                hotSpare: $scope.dataModel.isHotSpare
            };
            return payload;
        }

        function getAllSelectedDisksIds(diskList) {
            var selectedDiskList = [];
            _.forEach(diskList, function (disk) {
                if (disk.selected === true) {
                    selectedDiskList.push(disk.diskId);
                }
            });
            return selectedDiskList;
        }
    });
