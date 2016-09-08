'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ParityGroupsAddCtrl
 * @description
 * # ParityGroupsAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ParityGroupsAddCtrl', function ($scope, $routeParams, $timeout, $window, orchestratorService, diskSizeService, $location, synchronousTranslateService,
                                                 objectTransformService, paginationService, resourceTrackerService) {
        var storageSystemId = $routeParams.storageSystemId;
        var GET_DISKS_PATH = 'disks';
        var GET_STORAGE_SYSTEM_PATH = 'storage-systems';

        var raidMapping = {
            'RAID5':['3D+1P','4D+1P','6D+1P','7D+1P'],
            'RAID6':['14D+2P','12D+2P','6D+2P'],
            'RAID1+0':['2D+2D']
        };

        paginationService.getAllPromises(null, GET_STORAGE_SYSTEM_PATH, true, null, objectTransformService.transformStorageSystem).then(function (result) {

            var storageSystems = result;
            var selectable = _.isUndefined(storageSystemId);

            var storageSystem = _.find(storageSystems, function (s) {
                return selectable || s.storageSystemId === storageSystemId;
            });

            $scope.dataModel = buildDataModel(storageSystems, selectable);
            $scope.dataModel.displayPrompt= false;
            $scope.dataModel.raidTypeValidation = false;
            $scope.dataModel.raidLayoutValidation = false;
            $scope.dataModel.showRaidLayoutDropDown = true;
            $scope.dataModel.advEncryption = false;
            $scope.dataModel.basicEncryption = false;
            $scope.dataModel.storageSystem = storageSystem;

            if (storageSystem) {
                $scope.dataModel.selectedStorageSystemId = storageSystem.storageSystemId;
                orchestratorService.parityGroupTemplate(storageSystem.storageSystemId).then(parityGroupTemplateReturns);
                paginationService.getAllPromises(null, GET_DISKS_PATH, true, storageSystemId).then(storageSystemDisksReturns);
            }

            //Initial model with default wizardType
            $scope.model = {
                wizardType: 'basic'
            };

            $scope.dataModel.search = {
                freeText: '',
                totalCapacity: {
                    min: 0,
                    max: 1000,
                    unit: 'PB'
                },
                type: null,
                speed: null,
                purpose: null,
                raidLevel: null,
                raidLayout: null
            };

            $scope.itemSelected = false;
        });

        function buildDataModel(storageSystems, selectable) {
            var dataModel = {
                storageSystems: storageSystems,
                storageSystemSelectable: selectable,
                raidOptions: [],
                pgTemplateRows: [],
                uniqueRaidLevel: [],
                uniqueRaidLayout: []
            };

            // Methods to expose dataModel properties, used for Basic Mode
            dataModel.getBasicEncryption = function() {
                return $scope.dataModel.basicEncryption;
            };

            dataModel.getDiskType = function (item) {
                var convertedDiskCapacity = diskSizeService.getDisplaySize(item.size);
                return item.diskType + ' ' + diskSizeService.getDisplaySpeed(item.speed) + ' ' + convertedDiskCapacity.size + convertedDiskCapacity.unit;
            };

            dataModel.getUsableCapacity = function (raidOptions) {

                var newSize = raidOptions.numberOfParityGroups * raidOptions.singleParitiGroupSize;
                var convertedUsableCapacity = diskSizeService.getDisplaySize(newSize);
                return convertedUsableCapacity.size + ' ' + convertedUsableCapacity.unit;
            };

            dataModel.checkAdvancedSubmitDisable = function () {
                var listOfDisks = getAllSelectedDisksIds($scope.dataModel.disksList);
                return ($scope.dataModel.search.raidLevel === null || $scope.dataModel.search.raidLayout === null || (listOfDisks.length === 0));
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

        function parityGroupTemplateReturns(result) {
            var pgTemplateItems = result.parityGroupTemplateItems;
            if((pgTemplateItems && pgTemplateItems.length === 0) || !pgTemplateItems) {
                $scope.dataModel.displayPrompt = true;
            }
            $scope.dataModel.submitBasicDisabled = true;
            $scope.dataModel.parityGroupTemplateItems = result.parityGroupTemplateItems;
            $scope.dataModel.parityGroupPayloadItems = angular.copy(result.parityGroupTemplateItems);

            var pgTemplateRows = [];
            var raidOptions = [];

            var advancedRaidOptions = [];

            _.forEach(pgTemplateItems, function (pgTemplateItem) {
                advancedRaidOptions = advancedRaidOptions.concat(pgTemplateItem.raidOptions);
                pgTemplateItem.encryption = $scope.dataModel.getBasicEncryption();
                if (pgTemplateItem.numberOfAvailableDisks !== 0) {
                    var filteredRaidOptions = _.where(pgTemplateItem.raidOptions, function (option) {
                        return option.numberOfParityGroups > 0;
                    });

                    if (filteredRaidOptions.length === 0) {
                        return;
                    }
                    var pgTemplateRow = {
                        diskType: pgTemplateItem.diskType,
                        speed: pgTemplateItem.speed,
                        size: pgTemplateItem.size,
                        encryption: pgTemplateItem.encryption,
                        totalNumberOfDisks: pgTemplateItem.totalNumberOfDisks,
                        numberOfExistingHotSpares: pgTemplateItem.numberOfExistingHotSpares,
                        numberOfAvailableDisks: pgTemplateItem.numberOfAvailableDisks,
                        raidOptions: addDefaultRaidConfig(filteredRaidOptions),
                        raidConfig: filteredRaidOptions,
                        numberOfNewHotSpares: pgTemplateItem.numberOfNewHotSpares,
                        parityGroupTitle: 'Parity Group'
                    };
                    raidOptions = raidOptions.concat(filteredRaidOptions);
                    pgTemplateRows.push(pgTemplateRow);
                }

            });

            if(pgTemplateRows.length === 0) {
                $scope.dataModel.displayPrompt = true;
            }
            $scope.dataModel.raidOptions = $scope.dataModel.raidOptions.concat(raidOptions);
            $scope.dataModel.uniqueRaidLevel = _.uniq(_.pluck($scope.dataModel.raidOptions, 'raidLevel'));
            $scope.dataModel.uniqueRaidLayout = _.uniq(_.pluck($scope.dataModel.raidOptions, 'raidLayout'));
            $scope.dataModel.pgTemplateRows = $scope.dataModel.pgTemplateRows.concat(pgTemplateRows);

            $scope.dataModel.advancedUniqueRaidLevel = _.uniq(_.pluck(advancedRaidOptions, 'raidLevel'));
            $scope.dataModel.advancedUniqueRaidLayout = _.uniq(_.pluck(advancedRaidOptions, 'raidLayout'));
            $scope.dataModel.advancedUniqueRaidLayoutOriginal = _.uniq(_.pluck(advancedRaidOptions, 'raidLayout'));

            validateParityGroupsCount(pgTemplateItems);
        }

        function storageSystemDisksReturns(result) {
            var disks = result;
            $scope.dataModel.submitAdvanceDisabled = true;

            var disksList = [];
            var types = [];
            var speeds = [];
            var purposes = [];

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
                        convertedDiskCapacity: diskSizeService.getDisplaySize(disk.capacityInBytes),
                        speedOnly: diskSizeService.getDisplaySpeedOnly(disk.speed),
                        speedUnitOnly: diskSizeService.getDisplaySpeedUnitOnly(disk.speed)
                    };

                    if (disk.purpose === 'FREE') {
                        purposes.push('FREE');
                    }
                    if (disk.purpose === 'SPARE') {
                        purposes.push('SPARE');
                    }

                    types.push(disk.type);
                    speeds.push(disk.speed.toString());
                    disksList.push(storageSystemDisk);
                }
            });

            $scope.dataModel.types = types;
            $scope.dataModel.speeds = speeds;
            $scope.dataModel.purposes = purposes;
            $scope.dataModel.disksList = disksList;
            $scope.dataModel.uniqueDiskTypes = _.sortBy(_.uniq(types));
            $scope.dataModel.uniqueDiskSpeeds = _.sortBy(_.uniq(speeds));
            $scope.dataModel.uniqueDiskPurposes = _.sortBy(_.uniq(purposes));
        }

        function addDefaultRaidConfig(raidOptions) {
            var defaultOption = null;
            for (var i = 0; i < raidOptions.length; ++i) {
                var raidOption = raidOptions[i];
                raidOption.numberOfParityGroupsOriginal = raidOption.numberOfParityGroups;
                var usableCapacity =  diskSizeService.getDisplaySize(raidOption.usableCapacity);
                var origialCount = raidOption.numberOfParityGroupsOriginal;
                var singleItemSize = origialCount === 0 ? 0 : usableCapacity.value / origialCount;
                raidOption.singleParitiGroupSize  = singleItemSize;

                if (raidOption.isDefault) {
                    defaultOption = raidOption;
                }

            }
            if (!defaultOption) {
                defaultOption = raidOptions[0];
            }
            return defaultOption;
        }



        // Fired when another storage system is selected from the storage system dropdown list.
        $scope.changeStorageSystem = function (selectedStorageSystemId) {

            orchestratorService.parityGroupTemplate(selectedStorageSystemId).then(parityGroupTemplateReturns);
        };

        // Post call to the server to create parity groups
        $scope.createParityGroupsBasic = function () {

            if($scope.dataModel.submitBasicDisabled){
                return;
            }
            var createParityGroupsPayload = buildCreateParityGroupsPayloadBasic();
            orchestratorService.createParityGroups($scope.dataModel.selectedStorageSystemId, createParityGroupsPayload);

            $location.path('storage-systems/' + $scope.dataModel.selectedStorageSystemId + '/parity-groups');
        };

        // Post call to the server to create parity groups
        $scope.createParityGroupAdvanced = function () {
            
            if (!$scope.dataModel.search.raidLevel) {
                $scope.dataModel.raidTypeValidation = true;
            }else{
                $scope.dataModel.raidTypeValidation = false;
            }

            if (!$scope.dataModel.search.raidLayout) {
                $scope.dataModel.raidLayoutValidation = true;
            }else{
                $scope.dataModel.raidLayoutValidation = false;
            }


             if($scope.dataModel.checkAdvancedSubmitDisable()){
                 return;
             }
            var createParityGroupPayload = buildCreateParityGroupPayloadAdvanced();

            // Build reserved resources
            var reservedResourcesList = [];
            _.forEach(getAllSelectedDisksIds($scope.dataModel.disksList), function (diskId) {
                reservedResourcesList.push(diskId + '=' + resourceTrackerService.disk());
            });

            // Show popup if resource is present in resource tracker else submit
            resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                'Create Parity Group Confirmation', $scope.dataModel.selectedStorageSystemId, null, createParityGroupPayload, orchestratorService.createParityGroup);
        };

        $scope.$watch('dataModel.pgTemplateRows', function (pgTemplateRows) {
            if (!pgTemplateRows) {
                return;
            }
            validateParityGroupsCount(pgTemplateRows);
        }, true);

        $scope.$watch('dataModel.disksList', function (disksList) {
            var selected = false;
            _.forEach(disksList, function (disk) {
                if (disk.selected === true) {
                    selected = true;
                }
            });
            $scope.itemSelected = selected;

        }, true);

        function validateParityGroupsCount(pgTemplateRows) {
            var templateRows = angular.copy(pgTemplateRows);
            var hasInvalidPgCounts = _.some(templateRows, function (tr) {
                return _.isNull(tr.raidOptions.numberOfParityGroups) ||
                    _.isUndefined(tr.raidOptions.numberOfParityGroups) ||
                    tr.raidOptions.numberOfParityGroups % 1 !== 0;
            });

            if (hasInvalidPgCounts) {
                $scope.dataModel.submitBasicDisabled = true;

                angular.forEach(pgTemplateRows, function (tr) {
                   if(!tr.raidOptions.numberOfParityGroups) {
                       tr.parityGroupTitle = synchronousTranslateService.translate('parity-group-add-invalid-tooltip') + tr.raidOptions.numberOfParityGroupsOriginal;
                   } else{
                       tr.parityGroupTitle = 'Parity Group';
                   }
                });

                return;
            }

            var nonZeroTempRows = getRowsWithNonZeroParityGroupsFromPayload(templateRows);
            if (nonZeroTempRows.length === 0) {
                $scope.dataModel.submitBasicDisabled = true;
            } else {
                $scope.dataModel.submitBasicDisabled = false;
            }
        }

        // Generates payload for basic parity group creation based on parity group property selection
        function buildCreateParityGroupsPayloadBasic() {
            var payload = getRowsWithNonZeroParityGroupsFromPayload($scope.dataModel.pgTemplateRows);
            angular.forEach(payload, function (value) {
                value.raidLevel = value.raidOptions.raidLevel;
                value.raidLayout = value.raidOptions.raidLayout;
                value.numberOfParityGroups = value.raidOptions.numberOfParityGroups;
                value.encryption = $scope.dataModel.getBasicEncryption();
                delete value.numberOfAvailableDisks;
                delete value.numberOfExistingHotSpares;
                delete value.numberOfNewHotSpares;
                delete value.totalNumberOfDisks;
                delete value.raidConfig;
                delete value.raidOptions;
                delete value.$$hashKey;
            });
            var createParityGroupsPayload = {
                createParityGroupItems: payload
            };

            return createParityGroupsPayload;
        }

        // Generates payload for advanced parity group creation based on selected disks
        function buildCreateParityGroupPayloadAdvanced() {
            var disksList = getAllSelectedDisksIds($scope.dataModel.disksList);
            var createParityGroupPayload = {
                diskIds: disksList,
                raidLevel: $scope.dataModel.search.raidLevel,
                raidLayout: $scope.dataModel.search.raidLayout,
                encryption: $scope.dataModel.advEncryption
            };
            return createParityGroupPayload;
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

        function getRowsWithNonZeroParityGroupsFromPayload(temp) {
            _.forEach(temp, function(t){
                delete t.parityGroupTitle;
            });
            var rows = [];
            if (temp !== null) {
                for (var i = 0; i < temp.length; i++) {
                    if (temp[i].raidOptions.numberOfParityGroups > 0) {
                        rows.push(temp[i]);
                    }
                }
            }
            return rows;
        }



        $scope.$watch('dataModel.search.raidLevel', function(selected) {

            $scope.dataModel.showRaidLayoutDropDown = false;
            $timeout(setDropDownVisibility, 10);

            for(var key in raidMapping){
                if(raidMapping.hasOwnProperty(key) && selected === key){
                    var tempArray = angular.copy($scope.dataModel.advancedUniqueRaidLayoutOriginal);
                    $scope.dataModel.advancedUniqueRaidLayout = [];

                    for (var i = 0; i < tempArray.length; i++) {
                        if(raidMapping[key].indexOf(tempArray[i]) > -1){
                            $scope.dataModel.advancedUniqueRaidLayout.push(tempArray[i]);
                        }
                    }
                }
            }

        });
        function setDropDownVisibility() {
            $scope.dataModel.showRaidLayoutDropDown = true;
        }


    });
