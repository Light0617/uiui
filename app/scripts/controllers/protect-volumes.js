'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ProtectVolumesCtrl
 * @description
 * # ProtectVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ProtectVolumesCtrl', function ($scope, $routeParams, $timeout, $window, $filter, $q,
                                                orchestratorService, diskSizeService, ShareDataService,
                                                cronStringConverterService, paginationService, objectTransformService) {

        $scope.numberOfSnapshotsValidation = false;
        $scope.copyGroupNameValidation = false;
        $scope.numberOfCopiesValidation = false;
        $scope.dateValidation = false;
        $scope.minuteValidation = false;
        $scope.hourIntervalValidation = false;
        $scope.allUseExisting = false;
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

        var tasks = _.map(storageSystemIds, function (storageSystemId) {
            return paginationService.getAllPromises(null, 'replication-groups', true, storageSystemId,
                objectTransformService.transformReplicationGroup).then(function (result) {
                    allCopyGroups[storageSystemId] = result;
                }, function () {
                    allCopyGroups[storageSystemId] = [];
                });
        });

        $q.all(tasks).then(function () {
            initPage();
        });

        function initPage() {

            var HOURLY_KEY = 'HOURLY';
            var DAILY_KEY = 'DAILY';
            var MONTHLY_KEY = 'MONTHLY';
            var WEEKLY_KEY = 'WEEKLY';
            var SNAPSHOT = 'SNAPSHOT';
            var CLONE = 'CLONE';

            $scope.dataModel = {
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
            $scope.dataModel.scheduleTimeMins = 0;
            $scope.dataModel.scheduleMinute = 0;


            function populateCopyGroupsToVolumes() {
                var technology = $scope.dataModel.replicationTechnology;
                var numberOfCopiesInput = $scope.dataModel.numberOfSnapshots;
                numberOfCopiesInput = parseInt(numberOfCopiesInput);
                var scheduleString = scheduleStr();
                var consistencyGroupNeeded = $scope.dataModel.consistencyGroupNeeded ? 'On' : 'Off';

                if (technology === SNAPSHOT) {
                    _.forEach($scope.dataModel.volumeRows, function (volume) {
                        volume.copyGroupNames = _.where(allCopyGroups[volume.storageSystemId], function (cg) {
                            return ('Snapshot' === cg.type) &&
                                (consistencyGroupNeeded === cg.consistent) &&
                                (!_.isFinite(numberOfCopiesInput) || numberOfCopiesInput === cg.numberOfCopies) &&
                                (_.isEmpty(scheduleString) || cronStringConverterService.isEqualForObjectModel(scheduleString, cg.schedule));
                        });
                        volume.CGSelection = {};
                    });
                } else if (technology === CLONE) {
                    _.forEach($scope.dataModel.volumeRows, function (volume) {
                        volume.copyGroupNames = _.where(allCopyGroups[volume.storageSystemId], function (cg) {
                            return ('Clone' === cg.type) &&
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
            });

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

            $scope.CGChanged = function () {
                $scope.allUseExisting = true;
                for (var i = 0; i < $scope.dataModel.volumeRows.length; ++i) {
                    if (!$scope.dataModel.volumeRows[i].hasOwnProperty('CGSelection') ||
                        ($scope.dataModel.volumeRows[i].CGSelection && !$scope.dataModel.volumeRows[i].CGSelection.hasOwnProperty('name')) ||
                        $scope.dataModel.volumeRows[i].CGSelection === null ||
                        isEmpty($scope.dataModel.volumeRows[i].CGSelection)) {
                        $scope.allUseExisting = false;
                        break;
                    }
                }
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
                    var snapshotTasks = [];
                    for (var ss in $scope.arrayVolumeMap) {
                        var primaryVolumeIdsForCreate = [];
                        var replicationGroupIdVolumeIdMap = {};
                        if ($scope.arrayVolumeMap.hasOwnProperty(ss)) {
                            for (var volume in $scope.arrayVolumeMap[ss]) {
                                if ($scope.arrayVolumeMap[ss].hasOwnProperty(volume)) {
                                    if ($scope.arrayVolumeMap[ss][volume] === 'Use New') {
                                        primaryVolumeIdsForCreate.push(parseInt(volume));
                                    } else if (volume) {
                                        var volumeIds = replicationGroupIdVolumeIdMap[parseInt($scope.arrayVolumeMap[ss][volume])] || [];
                                        volumeIds.push(parseInt(volume));
                                        replicationGroupIdVolumeIdMap[parseInt($scope.arrayVolumeMap[ss][volume])] = volumeIds;
                                    }
                                }
                            }
                            var snapshotCreatePayload = {
                                name: replicationGroupName,
                                comments: comments,
                                consistent: consistencyGroupNeeded
                            };
                            snapshotCreatePayload.type = SNAPSHOT;
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
                'dataModel.hourInterval, dataModel.scheduleTimeUnit, dataModel.scheduleTimeHour, dataModel.scheduleTimeMins, dataModel.schedule]',
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
        }
    });
