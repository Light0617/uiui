'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ProtectVolumesCtrl
 * @description
 * # ProtectVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ProtectVolumesCtrl', function ($scope, $routeParams, $timeout, $window, $filter, $q, $modal,
                                                orchestratorService, diskSizeService, ShareDataService, replicationService,
                                                cronStringConverterService, paginationService, queryService, objectTransformService,
                                                synchronousTranslateService, storageSystemCapabilitiesService) {

        $scope.numberOfSnapshotsValidation = false;
        $scope.copyGroupNameValidation = false;
        $scope.numberOfCopiesValidation = false;
        $scope.dateValidation = false;
        $scope.minuteValidation = false;
        $scope.hourIntervalValidation = false;
        $scope.allUseExisting = false;
        $scope.arrayUseExisting = {};
        $scope.arraySupportSnapOnSnapCreation = {};
        $scope.arraySupportSnapshotTypes = {};
        $scope.volumeExistingProtectionTypeAsPVol = {};
        $scope.volumeExistingProtectionTypeAsPVolDisplayName = {};
        $scope.copyGroupNameRegexp = /^[a-zA-Z0-9_][a-zA-Z0-9-_]*$/;
        $scope.decimalNumberRegexp = /^[^.]+$/;
        $scope.orderByField = 'volumeId';
        $scope.reverseSort = false;
        $scope.storageSystemIds = [];
        $scope.selectBoxName = 'index';
        $scope.filterIndex = 1;
        $scope.volumesSelected = false;

        var volumesList = ShareDataService.volumesList;
        if (!volumesList) {
            window.history.back();
        } else {
            $scope.volumesSelected = true;
        }

        var storageSystemIds = _.uniq(_.pluck(volumesList, 'storageSystemId'));

        var allCopyGroups = {};

        var getProtectionTypeAsPVolTasks = _.map(volumesList, function(volume) {
            var storageSystemId = volume.storageSystemId;
            var volumeId = volume.volumeId;
            paginationService.clearQuery();
            queryService.setQueryMapEntry('primaryVolume.id', parseInt(volumeId));
            return paginationService.getAllPromises(null, 'volume-pairs', false, storageSystemId,
                objectTransformService.transformVolumePairs).then(function (result) {
                var protectionTypesAsPVol = _.map(result, function(volumePair) {
                    return volumePair.type;
                });

                var volumeExistingProtectionType = $scope.volumeExistingProtectionTypeAsPVol[storageSystemId] || {};
                volumeExistingProtectionType[volumeId] = _.uniq(protectionTypesAsPVol);
                $scope.volumeExistingProtectionTypeAsPVol[storageSystemId] = volumeExistingProtectionType;

                var volumeExistingProtectionTypeDisplayName = $scope.volumeExistingProtectionTypeAsPVolDisplayName[storageSystemId] || {};
                if (_.isEmpty($scope.volumeExistingProtectionTypeAsPVol[storageSystemId]) ||
                    _.isEmpty($scope.volumeExistingProtectionTypeAsPVol[storageSystemId][volumeId])) {
                    volumeExistingProtectionTypeDisplayName[volumeId] = '';
                } else {
                    volumeExistingProtectionTypeDisplayName[volumeId] =
                        _.map($scope.volumeExistingProtectionTypeAsPVol[storageSystemId][volumeId], function(type) {
                        return replicationService.displayReplicationType(type);
                    }).join(',');
                }
                $scope.volumeExistingProtectionTypeAsPVolDisplayName[storageSystemId] = volumeExistingProtectionTypeDisplayName;
            }, function() {
                window.history.back();
            });
        });

        var getReplicationTasks = _.map(storageSystemIds, function (storageSystemId) {
            return paginationService.getAllPromises(null, 'replication-groups', true, storageSystemId,
                objectTransformService.transformReplicationGroup).then(function (result) {
                allCopyGroups[storageSystemId] = result;
            }, function () {
                allCopyGroups[storageSystemId] = [];
            });
        });

        var storageSystems = {};
        var getStorageSystemsTask = paginationService.get(null, 'storage-systems', null, true, null)
            .then(function (result) {
                _.forEach(result.resources, function (item) {
                    objectTransformService.transformStorageSystem(item);
                });
                storageSystems = _.filter(result.resources, function (storageSystem) {
                    return _.include(storageSystemIds, storageSystem.storageSystemId);
                });
                _.forEach(storageSystems, function (storageSystem) {
                    $scope.arrayUseExisting[storageSystem.storageSystemId] = false;
                    $scope.arraySupportSnapOnSnapCreation[storageSystem.storageSystemId] =
                        storageSystemCapabilitiesService.isSupportSnapOnSnapCreation(
                            storageSystem.model, storageSystem.firmwareVersion);
                    $scope.arraySupportSnapshotTypes[storageSystem.storageSystemId] =
                        storageSystemCapabilitiesService.supportReplicationSnapshotTypes(
                            storageSystem.model, storageSystem.firmwareVersion);
                });
            }, function () {
                window.history.back();
            });

        var allStoragePools = {};

        var getPoolsTasks = _.map(storageSystemIds, function (storageSystemId) {
            return paginationService.getAllPromises(null, 'storage-pools', true, storageSystemId,
                objectTransformService.transformPool).then(function (result) {
                allStoragePools[storageSystemId] = result;
            }, function () {
                allStoragePools[storageSystemId] = [];
            });
        });

        var tasks = getProtectionTypeAsPVolTasks.concat(getReplicationTasks.concat(getPoolsTasks.concat(getStorageSystemsTask)));
        $q.all(tasks).then(function () {
            initPage();
        });

        function initPage() {

            var HOURLY_KEY = 'HOURLY';
            var DAILY_KEY = 'DAILY';
            var MONTHLY_KEY = 'MONTHLY';
            var WEEKLY_KEY = 'WEEKLY';
            var SNAPSHOT = replicationService.rawTypes.SNAP;
            var CLONE = replicationService.rawTypes.CLONE;
            var date = new Date();

            $scope.dataModel = {
                $replicationRawTypes: replicationService.rawTypes,
                replicationTechnology: SNAPSHOT,
                filterDD: false,
                schedule: HOURLY_KEY,
                submitDisabled: 'true',
                showDropDownColumn: true,
                numberOfCopiesInput: '',
                numberOfSnapshots: null,
                numberOfCopies: null,
                volumeRows: volumesList,
                consistencyGroupNeeded: false,
                currentDate: date,

                getSelectedVolumeCount: function () {
                    var selectedCount = 0;
                    _.forEach($scope.dataModel.volumeRows, function (volume) {
                        if (volume.isChecked === true) {
                            selectedCount++;
                        }
                    });

                    return selectedCount;
                }
            };

            $scope.dataModel.isEnableSnapshot = function() {
                return replicationService.isSnap($scope.dataModel.replicationTechnology);
            };

            $scope.dataModel.isEnableClone = function() {
                return replicationService.isClone($scope.dataModel.replicationTechnology);
            };

            $scope.dataModel.Days = {
                'Sun': {'isChecked': true, 'isDisabled': false},
                'Mon': {'isChecked': false, 'isDisabled': false},
                'Tue': {'isChecked': false, 'isDisabled': false},
                'Wed': {'isChecked': false, 'isDisabled': false},
                'Thu': {'isChecked': false, 'isDisabled': false},
                'Fri': {'isChecked': false, 'isDisabled': false},
                'Sat': {'isChecked': false, 'isDisabled': false}
            };

            $scope.dataModel.numberOfCopiesInput = $scope.dataModel.numberOfSnapshots;


            var d = new Date();
            d.setHours(24);
            d.setMinutes(0);

            $scope.dataModel.scheduleTime = d;
            $scope.dataModel.scheduleDate = 1;
            $scope.dataModel.hourInterval = 1;
            $scope.dataModel.scheduleTimeUnit = 'AM';
            $scope.dataModel.scheduleTimeHour = 12;
            $scope.dataModel.scheduleMinute = 0;

            $scope.dataModel.arraySnapshotPooList = [];
            _.map(storageSystems, function (storageSystem) {
                var poolTypes = storageSystemCapabilitiesService.supportSnapshotPoolType(storageSystem.model, storageSystem.firmwareVersion);
                var snapshotPools = filterSnapshotPools(storageSystem.storageSystemId, poolTypes);

                var arraySnapshotPool = {
                    storageSystemId: storageSystem.storageSystemId,
                    selectedPool: snapshotPools[0],
                    snapshotPools: snapshotPools
                };

                $scope.dataModel.arraySnapshotPooList.push(arraySnapshotPool);
            });

            function populateCopyGroupsToVolumes() {
                var technology = $scope.dataModel.replicationTechnology;
                var numberOfCopiesInput = $scope.dataModel.numberOfSnapshots;
                numberOfCopiesInput = parseInt(numberOfCopiesInput);
                var scheduleString = scheduleStr();
                var consistencyGroupNeeded = $scope.dataModel.consistencyGroupNeeded ? 'On' : 'Off';

                if (replicationService.isSnap(technology)) {
                    _.forEach($scope.dataModel.volumeRows, function (volume) {
                        // Get existed replication type list without Clone
                        var existingSnapshotTypesAsPvol =
                            _.chain($scope.volumeExistingProtectionTypeAsPVol[volume.storageSystemId][volume.volumeId])
                                .reject(function(type){
                                    return type === CLONE;
                                })
                                .map(function(type){
                                    return replicationService.displayReplicationType(type);
                                });
                        // Define default snapshot type. If the storage system supports snap on snap, use "snap on Snap".
                        var createNewSnapshotType = $scope.arraySupportSnapOnSnapCreation[volume.storageSystemId] ?
                            replicationService.dispTypes.SNAP_ON_SNAP: replicationService.dispTypes.SNAP;

                        volume.copyGroupNames = _.where(allCopyGroups[volume.storageSystemId], function (cg) {
                            // If target p-vol was not protected, use default type's replication group.
                            // Else use the replication groups that have same replication type
                            var isCopyGroupTypeMatch = isEmpty(existingSnapshotTypesAsPvol) ?
                                createNewSnapshotType === cg.type :
                                existingSnapshotTypesAsPvol.contains(cg.type);
                            return isCopyGroupTypeMatch &&
                                (consistencyGroupNeeded === cg.consistent) &&
                                (!_.isFinite(numberOfCopiesInput) || numberOfCopiesInput === cg.numberOfCopies) &&
                                (_.isEmpty(scheduleString) || cronStringConverterService.isEqualForObjectModel(scheduleString, cg.schedule));
                        });
                        volume.CGSelection = {};
                        initArraySnapshot();
                    });
                } else if (technology === CLONE) {
                    _.forEach($scope.dataModel.volumeRows, function (volume) {
                        volume.copyGroupNames = _.where(allCopyGroups[volume.storageSystemId], function (cg) {
                            return (replicationService.isClone(cg.type)) &&
                                (consistencyGroupNeeded === cg.consistent);
                        });
                        volume.CGSelection = {};
                    });
                }
            }

            $scope.$watchGroup(['dataModel.replicationTechnology', 'dataModel.scheduleTime'], function (newVal, oldVal) {
                if (!newVal || !oldVal) {
                    return;
                }
                $scope.allUseExisting = false;
                _.forEach($scope.dataModel.volumeRows, function (volume) {
                    volume.CGSelection = {};
                });

                initArraySnapshot();
            });

            function initArraySnapshot() {
                _.map($scope.arrayUseExisting, function(val, key){
                    $scope.arrayUseExisting[key] = false;
                });

                _.forEach($scope.dataModel.arraySnapshotPooList, function (snapshotPool) {
                    snapshotPool.selectedPool = snapshotPool.snapshotPools[0];
                });
            }

            $scope.filterCopyGroups = function () {
                $scope.dataModel.showDropDownColumn = false;
                $timeout(setDropDownVisibility, 500);
                populateCopyGroupsToVolumes();
            };

            function setDropDownVisibility() {
                $scope.dataModel.showDropDownColumn = true;
            }

            populateCopyGroupsToVolumes();

            $scope.deleteSelectedConfirmOk = function () {
                deleteVolumes();

                $('#deleteSelectedConfirmation').modal('hide');
            };

            function deleteVolumes() {
                for (var j = $scope.dataModel.volumeRows.length - 1; j >= 0; j--) {
                    if ($scope.dataModel.volumeRows[j].isChecked === true) {
                        $scope.dataModel.volumeRows.splice(j, 1);
                    }
                }

                if ($scope.dataModel.volumeRows.length === 0) {
                    $scope.dataModel.submitDisabled = true;
                }
            }

            // This property is bound to the checkbox in the table header
            $scope.dataModel.allItemsSelected = false;

            $scope.selectVolume = function () {

                $scope.changeSubmitButtonStatus();
                // If any volume switch is not checked, then uncheck the "allItemsSelected" checkbox
                for (var i = 0; i < $scope.dataModel.volumeRows.length; i++) {
                    if (!$scope.dataModel.volumeRows[i].isChecked) {
                        $scope.dataModel.allItemsSelected = false;
                        return;
                    }
                }

                // otherwise check the "allItemsSelected" checkbox
                $scope.dataModel.allItemsSelected = true;
            };


            $scope.changeSubmitButtonStatus = function () {
                if (requiredFieldsCheck()) {
                    $scope.dataModel.submitDisabled = false;
                    return;
                }
                $scope.dataModel.submitDisabled = true;
            };

            function requiredFieldsCheck() {
                if ($scope.dataModel.replicationTechnology === CLONE) {
                    if (!$scope.dataModel.copyGroupName) {
                        return false;
                    } else {
                        return true;
                    }
                }

                if ($scope.dataModel.replicationTechnology === SNAPSHOT && $scope.dataModel.schedule === HOURLY_KEY) {
                    if (!$scope.dataModel.numberOfSnapshots || !$scope.dataModel.copyGroupName ||
                        !$scope.dataModel.hourInterval || $scope.dataModel.scheduleMinute === null) {
                        return false;
                    } else {
                        return true;
                    }
                }
                if ($scope.dataModel.replicationTechnology === SNAPSHOT && $scope.dataModel.schedule === DAILY_KEY) {
                    if (!$scope.dataModel.numberOfSnapshots || !$scope.dataModel.copyGroupName) {
                        return false;
                    } else {
                        return true;
                    }
                }
                if ($scope.dataModel.replicationTechnology === SNAPSHOT && $scope.dataModel.schedule === WEEKLY_KEY) {
                    if (!$scope.dataModel.numberOfSnapshots || !$scope.dataModel.copyGroupName || !weekDaySelected()) {
                        return false;
                    } else {
                        return true;
                    }
                }
                if ($scope.dataModel.replicationTechnology === SNAPSHOT && $scope.dataModel.schedule === MONTHLY_KEY) {
                    if (!$scope.dataModel.numberOfSnapshots || !$scope.dataModel.copyGroupName || !$scope.dataModel.scheduleDate) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }

            // Fired when the checkbox in the list header is checked
            $scope.selectAll = function () {
                // Loop through all the volumes and set their isChecked property
                for (var i = 0; i < $scope.dataModel.volumeRows.length; i++) {
                    $scope.dataModel.volumeRows[i].isChecked = $scope.dataModel.allItemsSelected;
                }
            };

            function weekDaySelected() {
                for (var key in $scope.dataModel.Days) {
                    if ($scope.dataModel.Days.hasOwnProperty(key)) {
                        var obj = $scope.dataModel.Days[key];
                        for (var prop in obj) {
                            //this checks if this is objects own property and not from prototype prop inherited
                            if (obj.hasOwnProperty(prop) && prop === 'isChecked') {
                                if (obj[prop]) {
                                    return true;
                                }
                            }
                        }
                    }
                }
                return false;
            }

            $scope.$watch('dataModel.scheduleMinute', function(value) {
                $scope.dataModel.minuteDisplay = cronStringConverterService.addSuffix(value);
            });

            $scope.$watch('dataModel.schedule', function () {
                $scope.allUseExisting = false;
                if ($scope.dataModel.schedule === DAILY_KEY) {
                    $scope.dataModel.Days.Mon.isChecked = true;
                    $scope.dataModel.Days.Mon.isDisabled = true;
                    $scope.dataModel.Days.Tue.isChecked = true;
                    $scope.dataModel.Days.Tue.isDisabled = true;
                    $scope.dataModel.Days.Wed.isChecked = true;
                    $scope.dataModel.Days.Wed.isDisabled = true;
                    $scope.dataModel.Days.Thu.isChecked = true;
                    $scope.dataModel.Days.Thu.isDisabled = true;
                    $scope.dataModel.Days.Fri.isChecked = true;
                    $scope.dataModel.Days.Fri.isDisabled = true;
                    $scope.dataModel.Days.Sat.isChecked = true;
                    $scope.dataModel.Days.Sat.isDisabled = true;
                    $scope.dataModel.Days.Sun.isChecked = true;
                    $scope.dataModel.Days.Sun.isDisabled = true;

                }
                else {
                    $scope.dataModel.Days.Mon.isChecked = false;
                    $scope.dataModel.Days.Mon.isDisabled = false;
                    $scope.dataModel.Days.Tue.isChecked = false;
                    $scope.dataModel.Days.Tue.isDisabled = false;
                    $scope.dataModel.Days.Wed.isChecked = false;
                    $scope.dataModel.Days.Wed.isDisabled = false;
                    $scope.dataModel.Days.Thu.isChecked = false;
                    $scope.dataModel.Days.Thu.isDisabled = false;
                    $scope.dataModel.Days.Fri.isChecked = false;
                    $scope.dataModel.Days.Fri.isDisabled = false;
                    $scope.dataModel.Days.Sat.isChecked = false;
                    $scope.dataModel.Days.Sat.isDisabled = false;
                    $scope.dataModel.Days.Sun.isChecked = true;
                    $scope.dataModel.Days.Sun.isDisabled = false;
                }

                $scope.changeSubmitButtonStatus();
            });

            $scope.$watch('Days', function () {
                $scope.changeSubmitButtonStatus();
            }, true);

            function extractUniqueStorageSystemIds() {
                angular.forEach($scope.dataModel.volumeRows, function (volume) {
                    if ($scope.storageSystemIds.indexOf(volume.storageSystemId) < 0) {
                        $scope.storageSystemIds.push(volume.storageSystemId);
                    }
                });
            }

            function populateArrayVolumeMap() {
                $scope.arrayVolumeMap = {};

                angular.forEach($scope.storageSystemIds, function (said) {
                    var storageSystemValues = {};
                    angular.forEach($scope.dataModel.volumeRows, function (volume) {
                        if (said === volume.storageSystemId) {
                            var volId = volume.volumeId.toString();
                            if (volume.CGSelection && volume.CGSelection.id) {
                                storageSystemValues[volId] = volume.CGSelection.id;
                            } else {
                                storageSystemValues[volId] = 'Use New';
                            }
                        }
                    });
                    var saidStr = said.toString();
                    $scope.arrayVolumeMap[saidStr] = storageSystemValues;

                });
            }

            function isEmpty(obj) {
                return Object.keys(obj).length === 0;
            }

            $scope.CGChanged = function (storageSystemId) {
                $scope.allUseExisting = _.every($scope.dataModel.volumeRows, function (volumeRow) {
                    return isUseExisting(volumeRow);
                });

                var arrayVolumeRows = _.filter($scope.dataModel.volumeRows, function (volumeRows) {
                    return volumeRows.storageSystemId === storageSystemId;
                });
                $scope.arrayUseExisting[storageSystemId] = _.every(arrayVolumeRows, function (volumeRow) {
                    return isUseExisting(volumeRow);
                });
            };

            var isUseExisting = function (volumeRow) {
                return !(!volumeRow.hasOwnProperty('CGSelection') ||
                    (volumeRow.CGSelection && !volumeRow.CGSelection.hasOwnProperty('name')) ||
                    volumeRow.CGSelection === null ||
                    isEmpty(volumeRow.CGSelection));
            };

            var selectSnapTypesForCreate = function (storageSystemId, primaryVolumeIdsForCreate) {
                /**
                 * Return a suitable snapshotType for the specified volumes.
                 * Return null if no available snap shot types can be found.
                 */
                var existingSnapTypes =
                    _.chain(primaryVolumeIdsForCreate).map(function (volumeId) {
                        return $scope.volumeExistingProtectionTypeAsPVol[storageSystemId][volumeId];
                    }).flatten().uniq()
                        .reject(function (type) {
                            return type === CLONE;
                        }).value();
                if (_.isEmpty(existingSnapTypes)) {
                    return $scope.arraySupportSnapshotTypes[storageSystemId][0];
                } else if (existingSnapTypes.length === 1) {
                    if(_.contains($scope.arraySupportSnapshotTypes[storageSystemId], existingSnapTypes[0])) {
                        return existingSnapTypes[0];
                    }
                }
                return null;
            };

            var popUpCreateReplicationGroupError = function (storageSystemId, primaryVolumeIdsForCreate) {
                var modelInstance = $modal.open({
                    templateUrl: 'views/templates/error-modal.html',
                    windowClass: 'modal fade confirmation',
                    backdropClass: 'modal-backdrop',
                    controller: function ($scope) {
                        $scope.error = {};
                        $scope.error.message = (function (key) {
                            var variable = {
                                volumeIds: primaryVolumeIdsForCreate
                            };
                            return synchronousTranslateService.translate(key, variable);
                        })('replication-group-can-not-create-multiple-replication-types-message');
                        $scope.cancel = function () {
                            modelInstance.dismiss('cancel');
                        };

                        modelInstance.result.finally(function() {
                            $scope.cancel();
                        });
                    }
                });
            };

            $scope.validationForm = {};
            $scope.submitProtectVolumes = function () {

                if ($scope.dataModel.replicationTechnology === SNAPSHOT &&
                    $scope.validationForm.leftPanel.numberOfSnapshots &&
                    $scope.validationForm.leftPanel.numberOfSnapshots.$invalid) {
                    $scope.numberOfSnapshotsValidation = true;
                    $scope.numberOfCopiesValidation = true;
                }

                if ($scope.validationForm.rightPanel.copyGroupName &&
                    $scope.validationForm.rightPanel.copyGroupName.$invalid) {
                    $scope.copyGroupNameValidation = true;
                }

                if ($scope.dataModel.replicationTechnology === SNAPSHOT &&
                    $scope.dataModel.schedule === 'MONTHLY' &&
                    $scope.validationForm.timePicker.date.$invalid) {
                    $scope.dateValidation = true;
                }

                if ($scope.dataModel.replicationTechnology === SNAPSHOT &&
                    $scope.dataModel.schedule === 'HOURLY' &&
                    $scope.validationForm.timePicker.minute.$invalid) {
                    $scope.minuteValidation = true;
                }

                if ($scope.dataModel.replicationTechnology === SNAPSHOT &&
                    $scope.dataModel.schedule === 'HOURLY' &&
                    $scope.validationForm.timePicker.hourInterval.$invalid) {
                    $scope.hourIntervalValidation = true;
                }

                if ($scope.allUseExisting) {
                    $scope.dataModel.submitDisabled = false;
                }

                if ($scope.dataModel.submitDisabled === true ||
                    ($scope.dataModel.replicationTechnology === SNAPSHOT &&
                    $scope.validationForm.leftPanel.numberOfSnapshots &&
                    $scope.validationForm.leftPanel.numberOfSnapshots.$invalid) ||
                    ($scope.validationForm.rightPanel.copyGroupName &&
                    $scope.validationForm.rightPanel.copyGroupName.$invalid) ||
                    ($scope.dataModel.replicationTechnology === SNAPSHOT &&
                    $scope.dataModel.schedule === 'MONTHLY' &&
                    $scope.validationForm.timePicker.date.$invalid) ||
                    ($scope.dataModel.replicationTechnology === SNAPSHOT &&
                    $scope.dataModel.schedule === 'HOURLY' &&
                    ($scope.validationForm.timePicker.minute.$invalid ||
                    $scope.validationForm.timePicker.hourInterval.$invalid))) {
                    return;
                }

                extractUniqueStorageSystemIds();

                var comments = '';
                var replicationGroupName = '';
                var consistencyGroupNeeded = false;

                if ($scope.dataModel.comments) {
                    comments = $scope.dataModel.comments;
                }
                if ($scope.dataModel.copyGroupName) {
                    replicationGroupName = $scope.dataModel.copyGroupName;
                }
                if ($scope.dataModel.consistencyGroupNeeded) {
                    consistencyGroupNeeded = $scope.dataModel.consistencyGroupNeeded;
                }

                populateArrayVolumeMap();

                if ($scope.dataModel.replicationTechnology === SNAPSHOT) {
                    var primaryVolumeIdsForCreateForStorages = {};
                    var replicationGroupIdVolumeIdMapForStorages = {};
                    var suitableSnapShotTypesForCreateForStorages = {};
                    // Check all create new submittable
                    for (var storageSystemId in $scope.arrayVolumeMap) {
                        if (!$scope.arrayVolumeMap.hasOwnProperty(storageSystemId)) {
                            continue;
                        }
                        primaryVolumeIdsForCreateForStorages[storageSystemId] = [];
                        replicationGroupIdVolumeIdMapForStorages[storageSystemId] = {};
                        suitableSnapShotTypesForCreateForStorages[storageSystemId] = '';

                        for (var volume in $scope.arrayVolumeMap[storageSystemId]) {
                            if ($scope.arrayVolumeMap[storageSystemId].hasOwnProperty(volume)) {
                                if ($scope.arrayVolumeMap[storageSystemId][volume] === 'Use New') {
                                    primaryVolumeIdsForCreateForStorages[storageSystemId].push(parseInt(volume));
                                } else if (volume) {
                                    var volumeIds = replicationGroupIdVolumeIdMapForStorages[storageSystemId][parseInt($scope.arrayVolumeMap[storageSystemId][volume])] || [];
                                    volumeIds.push(parseInt(volume));
                                    replicationGroupIdVolumeIdMapForStorages[storageSystemId][parseInt($scope.arrayVolumeMap[storageSystemId][volume])] = volumeIds;
                                }
                            }
                        }

                        if (!_.isEmpty(primaryVolumeIdsForCreateForStorages[storageSystemId])) {
                            suitableSnapShotTypesForCreateForStorages[storageSystemId] =
                                selectSnapTypesForCreate(storageSystemId, primaryVolumeIdsForCreateForStorages[storageSystemId]);
                            if (_.isNull(suitableSnapShotTypesForCreateForStorages[storageSystemId])) {
                                // Halt submit if any of replication group can not be created.
                                popUpCreateReplicationGroupError(storageSystemId, primaryVolumeIdsForCreateForStorages[storageSystemId]);
                                return;
                            }
                        }
                    }

                    var snapshotTasks = [];
                    for (var ss in $scope.arrayVolumeMap) {
                        if (!$scope.arrayVolumeMap.hasOwnProperty(ss)) {
                            continue;
                        }
                        var primaryVolumeIdsForCreate = primaryVolumeIdsForCreateForStorages[ss];
                        var replicationGroupIdVolumeIdMap = replicationGroupIdVolumeIdMapForStorages[ss];
                        var suitableSnapShotTypesForCreate = suitableSnapShotTypesForCreateForStorages[ss];

                        var snapshotCreatePayload = {
                            name: replicationGroupName,
                            comments: comments,
                            consistent: consistencyGroupNeeded
                        };
                        snapshotCreatePayload.type = suitableSnapShotTypesForCreate;
                        snapshotCreatePayload.numberOfCopies = $scope.dataModel.numberOfCopiesInput;
                        snapshotCreatePayload.primaryVolumeIds = primaryVolumeIdsForCreate;
                        snapshotCreatePayload.schedule =
                            cronStringConverterService.fromDatePickerToObjectModel($scope.dataModel.schedule,
                                $scope.dataModel.scheduleTime, $scope.dataModel.scheduleDate, getDaysStr(),
                                $scope.dataModel.hourInterval, $scope.dataModel.scheduleMinute);

                        if (!_.isEmpty(snapshotCreatePayload.primaryVolumeIds)) {
                            snapshotTasks.push(orchestratorService.createReplicationGroup(ss, snapshotCreatePayload));
                        }

                        for (var rg in replicationGroupIdVolumeIdMap) {
                            if (replicationGroupIdVolumeIdMap.hasOwnProperty(rg)) {
                                snapshotTasks.push(orchestratorService.protectVolumes(parseInt(ss),
                                    parseInt(rg), {primaryVolumeIds: replicationGroupIdVolumeIdMap[rg]}));
                            }
                        }

                        for (var i = 0; i < $scope.dataModel.arraySnapshotPooList.length; i++) {
                            var snapshotPool = $scope.dataModel.arraySnapshotPooList[i];
                            if (!_.isEmpty(snapshotPool) && snapshotPool.storageSystemId === ss) {
                                snapshotCreatePayload.targetPoolId = snapshotPool.selectedPool.storagePoolId;
                                break;
                            }
                        }
                    }
                    $q.all(snapshotTasks).then(function () {
                        window.history.back();
                    });
                } else if ($scope.dataModel.replicationTechnology === CLONE) {
                    var cloneTasks = [];
                    for (var cloneSS in $scope.arrayVolumeMap) {
                        var clonePrimaryVolumeIdsForCreate = [];
                        var cloneReplicationGroupIdVolumeIdMap = {};
                        if ($scope.arrayVolumeMap.hasOwnProperty(cloneSS)) {
                            for (var cloneVolume in $scope.arrayVolumeMap[cloneSS]) {
                                if ($scope.arrayVolumeMap[cloneSS].hasOwnProperty(cloneVolume)) {
                                    if ($scope.arrayVolumeMap[cloneSS][cloneVolume] === 'Use New') {
                                        clonePrimaryVolumeIdsForCreate.push(parseInt(cloneVolume));
                                    } else if (cloneVolume) {
                                        var cloneVolumeIds =
                                            cloneReplicationGroupIdVolumeIdMap[parseInt($scope.arrayVolumeMap[cloneSS][cloneVolume])] || [];
                                        cloneVolumeIds.push(parseInt(cloneVolume));
                                        cloneReplicationGroupIdVolumeIdMap[parseInt($scope.arrayVolumeMap[cloneSS][cloneVolume])] = cloneVolumeIds;
                                    }
                                }
                            }
                            var cloneCreatePayload = {
                                name: replicationGroupName,
                                comments: comments,
                                consistent: consistencyGroupNeeded
                            };
                            cloneCreatePayload.type = CLONE;
                            cloneCreatePayload.primaryVolumeIds = clonePrimaryVolumeIdsForCreate;

                            if (!isEmpty(cloneCreatePayload.primaryVolumeIds)) {
                                cloneTasks.push(orchestratorService.createReplicationGroup(cloneSS, cloneCreatePayload));
                            }

                            for (var cloneRg in cloneReplicationGroupIdVolumeIdMap) {
                                if (cloneReplicationGroupIdVolumeIdMap.hasOwnProperty(cloneRg)) {
                                    cloneTasks.push(orchestratorService.protectVolumes(parseInt(cloneSS),
                                        parseInt(cloneRg), {primaryVolumeIds: cloneReplicationGroupIdVolumeIdMap[cloneRg]}));
                                }
                            }
                        }
                    }
                    $q.all(cloneTasks).then(function () {
                        window.history.back();
                    });
                }
            };

            function scheduleStr() {
                return  cronStringConverterService.fromDatePickerToObjectModel($scope.dataModel.schedule,
                    $scope.dataModel.scheduleTime, $scope.dataModel.scheduleDate, getDaysStr(),
                    $scope.dataModel.hourInterval, $scope.dataModel.scheduleMinute);
            }

            function getDaysStr() {

                var daysStr = '';
                if ($scope.dataModel.Days.Mon.isChecked) {
                    daysStr = daysStr + 'Monday, ';
                }
                if ($scope.dataModel.Days.Tue.isChecked) {
                    daysStr = daysStr + 'Tuesday, ';
                }
                if ($scope.dataModel.Days.Wed.isChecked) {
                    daysStr = daysStr + 'Wednesday, ';
                }
                if ($scope.dataModel.Days.Thu.isChecked) {
                    daysStr = daysStr + 'Thursday, ';
                }
                if ($scope.dataModel.Days.Fri.isChecked) {
                    daysStr = daysStr + 'Friday, ';
                }
                if ($scope.dataModel.Days.Sat.isChecked) {
                    daysStr = daysStr + 'Saturday, ';
                }
                if ($scope.dataModel.Days.Sun.isChecked) {
                    daysStr = daysStr + 'Sunday, ';
                }

                // Remove the comma in the end
                if (daysStr !== '' && daysStr.length > 2) {
                    return daysStr.substring(0, daysStr.length - 2);
                }
                // If no day selected return an empty string
                return ' ';
            }

            $scope.$watchCollection('[dataModel.replicationTechnology, dataModel.numberOfSnapshots,' +
                'dataModel.numberOfCopies, dataModel.consistencyGroupNeeded, dataModel.scheduleTime,dataModel.scheduleDate, ' +
                'dataModel.hourInterval, dataModel.scheduleTimeUnit, dataModel.scheduleTimeHour, dataModel.scheduleMinute, dataModel.schedule]',
                function (newValue, oldValue) {
                    if ($scope.dataModel.replicationTechnology === SNAPSHOT) {
                        $scope.dataModel.numberOfCopiesInput = $scope.dataModel.numberOfSnapshots;
                    } else {
                        $scope.dataModel.numberOfCopiesInput = $scope.dataModel.numberOfCopies;
                    }
                    if (newValue !== oldValue) {
                        $scope.filterCopyGroups();
                    }
                    $scope.changeSubmitButtonStatus();
                }, true);

            $scope.$watch('dataModel.Days', function (newValue, oldValue){
                if (newValue !== oldValue) {
                    $scope.filterCopyGroups();
                }
                $scope.changeSubmitButtonStatus();
            }, true);

            $scope.filterCopyGroups();

            /**
             * @return {boolean}
             */
            $scope.showArraySnapshotPool = function (storageSystemId) {
                return !$scope.arrayUseExisting[storageSystemId];
            };

            $scope.isShowTargetPoolDescription = function() {
                return _.some($scope.dataModel.arraySnapshotPooList, function (arraySnapshotPool) {
                    return !$scope.arrayUseExisting[arraySnapshotPool.storageSystemId] &&
                        _.size(arraySnapshotPool.snapshotPools) > 1;
                });
            };

            function filterSnapshotPools(storageSystemId, poolTypes) {
                var snapshotPools = [{
                    displayLabel: synchronousTranslateService.translate('common-auto-selected'),
                    storagePoolId: null
                }];

                var storagePools = allStoragePools[storageSystemId];
                _.chain(storagePools)
                    .filter(function (pool) {
                        return _.contains(poolTypes, pool.type)
                    })
                    .filter(function (pool) {
                        return pool.isReservedPool !== true
                    })
                    .map(function (pool) {
                        pool.displayLabel = pool.snapshotPoolLabelWithPoolId();
                        return pool;
                    })
                    .sortBy('storagePoolId')
                    .forEach(function (pool) {
                        snapshotPools.push(pool);
                    });

                return snapshotPools;
            }
        }
    });
