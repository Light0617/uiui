'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ParityGroupsCtrl
 * @description
 * # ParityGroupsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ParityGroupsCtrl', function ($q, $scope, $routeParams, $timeout, orchestratorService, objectTransformService, synchronousTranslateService, diskSizeService, scrollDataSourceBuilderService, $location, paginationService) {
        var storageSystemId = $routeParams.storageSystemId;
        var title = synchronousTranslateService.translate('common-parity-groups');
        var getParityGroupsPath = 'parity-groups';
        var storageSystem;

        orchestratorService.parityGroupSummary(storageSystemId).then(function(result){
            var pgSumWithConfCountCap = [];
            if(result && result.parityGroupSummaryItems) {

                var pgSummaryItems = result.parityGroupSummaryItems;

                for (var i = 0; i < pgSummaryItems.length; i++) {
                    var tempRecord = {};
                    // Prepare DiskConfig
                    var diskCap = diskSizeService.getDisplaySize(pgSummaryItems[i].size);
                    var diskSpeed = diskSizeService.getDisplaySpeed(pgSummaryItems[i].speed);
                    if (_.isNull(diskSpeed) || _.isUndefined(diskSpeed)) {
                        tempRecord.diskConfig = (pgSummaryItems[i].diskType + ' ' + diskCap.size + diskCap.unit);
                    } else {
                        tempRecord.diskConfig = (pgSummaryItems[i].diskType + ' ' + diskSpeed + ' ' + diskCap.size + diskCap.unit);
                    }
                    tempRecord.pgCount = pgSummaryItems[i].numberOfParityGroups;

                    var temp = pgSummaryItems[i].totalCapacity;
                    tempRecord.pgCapacity = diskSizeService.getDisplaySize(temp);

                    tempRecord.numberOfAvailableDisks = pgSummaryItems[i].numberOfAvailableDisks;
                    tempRecord.numberOfExistingHotSpares = pgSummaryItems[i].numberOfExistingHotSpares;
                    pgSumWithConfCountCap.push(tempRecord);
                }
                pgSumWithConfCountCap = _.sortBy(pgSumWithConfCountCap, 'diskConfig');
            }
            $scope.summaryModel = pgSumWithConfCountCap;
        });

        var getUniqueRaidConfig = function (item) {
            var uniqueRaidConfigs = [];
            for (var j = 0; j < item.length; j++) {
                var raidLevel = item[j].raidLevel;
                var raidLayout = item[j].raidLayout;
                var raid = raidLevel + ' ' + raidLayout;
                if (!_.contains(uniqueRaidConfigs, raid)) {
                    uniqueRaidConfigs.push(raid);
                }
            }
            uniqueRaidConfigs = _.sortBy(uniqueRaidConfigs);
            return uniqueRaidConfigs;
        };

        var getAllDiskConfigs = function (item) {

            var allDiskConfigs = [];
            //find out all disk configs from get PGs result
            for (var j = 0; j < item.length; j++) {

                var diskType = item[j].diskSpec.type;
                var diskCap = diskSizeService.getDisplaySize(item[j].diskSpec.capacityInBytes);
                var diskSpeed = item[j].diskSpec.speed;

                var disk;
                if (_.isNull(diskSpeed) || _.isUndefined(diskSpeed)) {
                    disk = (diskType + '' + diskCap.size + diskCap.unit);
                } else {
                    disk = (diskType + ' ' + diskSpeed + ' ' + diskCap.size + diskCap.unit);
                }

                allDiskConfigs.push({
                    conf: disk,
                    pgCap: item[j].totalCapacityInBytes
                });
            }
            $scope.allDiskConfigs = allDiskConfigs;
            return allDiskConfigs;

        };

        var getUniqueDiskConfig = function (item) {
            var uniqueDiskConfigs = [];
            var allDisks = getAllDiskConfigs(item);

            //find out unique disk configs from all disks in get PGs result
            for (var j = 0; j < allDisks.length; j++) {

                if (_.findIndex(uniqueDiskConfigs, {
                    conf: allDisks[j].conf
                }) < 0) {
                    var initCount = 0;
                    uniqueDiskConfigs.push({
                        conf: allDisks[j].conf,
                        pgCount: initCount,
                        pgCap: initCount
                    });
                }
            }
            uniqueDiskConfigs = _.sortBy(uniqueDiskConfigs, 'conf');
            $scope.uniqueDiskConfigs = uniqueDiskConfigs;
            getCountAndCapacityPerUniqueDisk(allDisks);
            return uniqueDiskConfigs;
        };

        var getCountAndCapacityPerUniqueDisk = function (allDisks) {
            //update pg count and pg capacity in $scope.uniqueDiskConfigs
            for (var j = 0; j < allDisks.length; j++) {

                var updatedDiskConfRecord = _.where($scope.uniqueDiskConfigs, {
                    conf: allDisks[j].conf
                });
                updatedDiskConfRecord[0].conf = allDisks[j].conf;
                updatedDiskConfRecord[0].pgCount += 1;
                updatedDiskConfRecord[0].pgCap += parseInt(allDisks[j].pgCap);
            }
        };

        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            $scope.storageSystemModel = result.model;
            storageSystem = result;
            return paginationService.getAllPromises(null, getParityGroupsPath, true, storageSystemId, objectTransformService.transformParityGroup);
        }).then(function(result) {
            var parityGroups = result;
            var dataModel = {
                storageSystemId: storageSystemId,
                storageSystem: storageSystem,
                title: title,
                view: 'tile',
                parityGroups: parityGroups,
                raidConfig: getUniqueRaidConfig(parityGroups),
                raidSelection: $scope.raidSelection,
                diskConfig: getUniqueDiskConfig(parityGroups),
                allItemsSelected: false,
                search: {
                    freeText: '',
                    encryption: null,
                    compression: null,
                    totalCapacity: {
                        min: 0,
                        max: 1000,
                        unit: 'PB'
                    }
                },
                sort: {
                    field: 'parityGroupId',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            } else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                },
                statuses: ['AVAILABLE', 'AVAILABLE_PHYSICAL', 'FORMATTING', 'QUICK_FORMATTING', 'IN_USE', 'UNINITIALIZED', 'UNSUPPORTED_ATTACHED','UNSUPPORTED_INACCESSIBLE_RESOURCEGROUP'],
                getSelectedParityGroupCount: function () {
                    var selectedCount = 0;
                    _.forEach($scope.dataModel.filteredList, function (parityGroup) {
                        if (parityGroup.selected === true) {
                            selectedCount++;
                        }
                    });

                    return selectedCount;
                }
            };

            var initializeParityGroupAction= {
                icon: 'icon-initialize-pg',
                tooltip: 'parity-group-initialize-tooltip',
                type: 'confirm',
                confirmTitle: 'parity-group-initialize-confirmation',
                confirmMessage: 'parity-group-initialize-selected-content',
                enabled: function () {
                    var containsAvailable = _.find(dataModel.getSelectedItems(), function (item) { return item.status === 'AVAILABLE'; });
                    return dataModel.anySelected() && !containsAvailable;
                },
                onClick: function () {
                    _.forEach(dataModel.getSelectedItems(), function (item) {
                        item.actions.initialize.onClick(orchestratorService, false);
                    });
                }
            };
            var compressParityGroupAction= {
                icon: 'icon-compression',
                tooltip: 'parity-group-compress-tooltip',
                type: 'confirm',
                confirmTitle: 'parity-group-compress-confirmation',
                confirmMessage: 'parity-group-compress-selected-content',
                enabled: function () {
                    return dataModel.anySelected() && !_.find(dataModel.getSelectedItems(), function(item) {
                            return item.encryption || item.diskSpec.type === 'SAS' || item.diskSpec.type === 'SSD' || item.diskSpec.type === 'FMD' ||
                                item.status !== 'AVAILABLE' || item.compression; });
                },
                onClick: function () {
                    _.forEach(dataModel.getSelectedItems(), function (item) {
                        item.actions.compress.onClick(orchestratorService, false);
                    });
                }
            };
            var deletePartityGroupAction={
                icon: 'icon-delete',
                    tooltip :'action-tooltip-delete',
                type: 'confirm',
                confirmTitle: 'parity-group-delete-confirmation',
                confirmMessage: 'parity-group-delete-selected-content',
                enabled: function () {
                return dataModel.anySelected();
            },
                onClick: function () {
                    _.forEach(dataModel.getSelectedItems(), function (item) {
                        item.actions.delete.onClick(orchestratorService, false);
                    });
                }
            };

            var hm800Actions = [
                initializeParityGroupAction,deletePartityGroupAction, compressParityGroupAction
            ];

            var r800Actions = [
                initializeParityGroupAction, compressParityGroupAction
            ];
            dataModel.getActions = function () {
                if ($scope.storageSystemModel === 'VSP G1000')
                {
                    return r800Actions;
                }
                return hm800Actions;
            };


            if ($scope.storageSystemModel !== 'VSP G1000') {
                dataModel.addAction = function () {
                    $location.path(['storage-systems', storageSystemId, 'parity-groups', 'add'].join('/'));
                };
            }
            else {
                dataModel.hideAddTile = true;
            }

            dataModel.gridSettings = [
                {
                    title: 'ID',
                    sizeClass: 'twelfth',
                    sortField: 'parityGroupId',
                    getDisplayValue: function (item) {
                        return item.parityGroupId;
                    },
                    type: 'id'

                },
                {
                    title: 'Status',
                    sizeClass: 'twelfth',
                    sortField: 'status',
                    getDisplayValue: function (item) {
                        return item.status;
                    }

                },
                {
                    title: 'RAID Type',
                    sizeClass: 'twelfth',
                    sortField: 'raidType',
                    getDisplayValue: function (item) {
                        return item.raidType;
                    }

                },
                {
                    title: 'Disk Type',
                    sizeClass: 'twelfth',
                    sortField: 'diskType',
                    getDisplayValue: function (item) {
                        return item.diskType;
                    }

                },
                {
                    title: 'common-label-total',
                    sizeClass: 'twelfth',

                    sortField: 'total.value',
                    getDisplayValue: function (item) {
                        return item.total;
                    },
                    type: 'size'

                },
                {
                    title: 'common-label-free',
                    sizeClass: 'twelfth',
                    sortField: 'free.value',
                    getDisplayValue: function (item) {
                        return item.free;
                    },
                    type: 'size'

                },
                {
                    title: 'common-label-used',
                    sizeClass: 'twelfth',
                    sortField: 'used.value',
                    getDisplayValue: function (item) {
                        return item.used;
                    },
                    type: 'size'

                }
            ];

            $scope.dataModel = dataModel;

            scrollDataSourceBuilderService.setupDataLoader($scope, parityGroups, 'parityGroupsSearch');
        });

        function deleteParityGroups() {
            _.forEach($scope.dataModel.filteredList, function (parityGroup) {
                if (parityGroup.selected === true) {
                    orchestratorService.deleteParityGroup(parityGroup.storageSystemId, parityGroup.parityGroupId);
                }
            });
        }

        $scope.deleteSelectedConfirmOk = function () {
            deleteParityGroups();
        };

        function initializeParityGroups() {
            _.forEach($scope.dataModel.filteredList, function (parityGroup) {
                if (parityGroup.selected === true) {
                    orchestratorService.initializeParityGroup(parityGroup.storageSystemId, parityGroup.parityGroupId);
                }
            });
        }

        $scope.initializeSelectedConfirmOk = function () {
            initializeParityGroups();
        };

        function compressParityGroups() {
            _.forEach($scope.dataModel.filteredList, function (parityGroup) {
                if (parityGroup.selected === true) {
                    orchestratorService.compressParityGroup(parityGroup.storageSystemId, parityGroup.parityGroupId);
                }
            });
        }

        $scope.compressSelectedConfirmOk = function () {
            compressParityGroups();
        };
    });
