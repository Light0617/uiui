'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:replicationGroupEditCtrl
 * @description
 * # replicationGroupEditCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('replicationGroupEditCtrl', function ($scope, orchestratorService, objectTransformService,
                                                      $routeParams, $q, $timeout, cronStringConverterService,
                                                      ShareDataService, $filter, paginationService, queryService,
                                                      storageSystemVolumeService) {
        var storageSystemId = $routeParams.storageSystemId;
        var replicationGroup = _.first(ShareDataService.selectedReplicationGroup);
        var primaryVolumes = [];
        $scope.anyPrimaryVolumeSelected = false;
        $scope.allPrimaryVolumeSelected = false;
        $scope.validationForm = {};
        if (!replicationGroup) {
            window.history.back();
        }

        _.forEach(replicationGroup.primaryVolumeIds, function (pvolId) {
            primaryVolumes.push({
                id: pvolId,
                label: 'N/A',
                numberOfSecondaryVolume: 'N/A',
                primaryStorageSystemId: replicationGroup.storageSystemId,
                selected: false
            });
        });

        var getLabelAndNumberOfSVolForEachPVolTasks = _.map(primaryVolumes, function (pvol) {
            return orchestratorService.volume(storageSystemId, parseInt(pvol.id)).then(function (result) {
                pvol.label = result.label;
                paginationService.clearQuery();
                queryService.setQueryMapEntry('replicationGroup', replicationGroup.name.toString());
                queryService.setQueryMapEntry('primaryVolume.id', parseInt(pvol.id));
                return paginationService.get(null, storageSystemVolumeService.VOLUME_PAIRS_PATH, null, false, storageSystemId);
            }).then(function (result) {
                pvol.numberOfSecondaryVolume = result.total;
            });
        });

        $q.all(getLabelAndNumberOfSVolForEachPVolTasks).then(function () {
            initPage();
        });

        function initPage() {
            $scope.dataModel = {
                schedule: replicationGroup.schedule ?
                    cronStringConverterService.fromObjectModelToDatePicker(replicationGroup.schedule) : null,
                comments: replicationGroup.comments && replicationGroup.comments !== 'N/A' ? replicationGroup.comments : '',
                numberOfSnapshots: replicationGroup.numberOfCopies ? replicationGroup.numberOfCopies : null,
                removeSecondaryVolume: true,
                primaryVolumesOpen: false,
                noPrimaryVolume: _.isEmpty(primaryVolumes) ? true : false,
                primaryVolumes: _.sortBy(primaryVolumes, 'id'),
                replicationType: replicationGroup.type,
                replicationName: replicationGroup.name,
                replicationConsistency: replicationGroup.consistent,
                sort: {
                    field: 'id',
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
                }
            };

            $scope.canSubmit = function () {
                if ($scope.dataModel.replicationType === 'Clone') {
                    return ($scope.anyPrimaryVolumeSelected && $scope.dataModel.replicationName) ||
                        ($scope.dataModel.replicationName && $scope.dataModel.replicationName !== replicationGroup.name) ||
                        ($scope.dataModel.replicationName && $scope.dataModel.comments !==
                        (replicationGroup.comments !== 'N/A' ? replicationGroup.comments : ''));
                }

                if ($scope.dataModel.replicationType === 'Snapshot') {
                    return canSubmitSnapshot();
                }
            };

            $scope.$watch('dataModel.primaryVolumes', function (newValue, oldValue) {
                if (!newValue || !oldValue) {
                    return;
                }
                if (newValue !== oldValue) {
                    var anyPrimaryVolumeSelected = false;
                    var allPrimaryVolumeSelected = true;
                    for (var i = 0; i < $scope.dataModel.primaryVolumes.length; ++i) {
                        if ($scope.dataModel.primaryVolumes[i].selected) {
                            anyPrimaryVolumeSelected = true;
                        }
                        if (!$scope.dataModel.primaryVolumes[i].selected) {
                            allPrimaryVolumeSelected = false;
                        }
                    }
                    $scope.anyPrimaryVolumeSelected = anyPrimaryVolumeSelected;
                    $scope.allPrimaryVolumeSelected = allPrimaryVolumeSelected;
                }
            }, true);

            $scope.$watch('dataModel.sort', function () {
                if ($scope.dataModel) {
                    $scope.dataModel.primaryVolumes = $filter('orderBy')($scope.dataModel.primaryVolumes,
                        $scope.dataModel.sort.field, $scope.dataModel.sort.reverse);
                }
            }, true);

            $scope.submitActions = function () {
                if ($scope.dataModel.replicationType === 'Clone') {
                    var cloneTasks = [];

                    var clonePayload = {};
                    if ($scope.dataModel.comments !== (replicationGroup.comments !== 'N/A' ?
                            replicationGroup.comments : '')) {
                        clonePayload.comments = $scope.dataModel.comments;
                    }
                    if ($scope.dataModel.replicationName && $scope.dataModel.replicationName !== replicationGroup.name) {
                        clonePayload.name = $scope.dataModel.replicationName;
                    }
                    if (!_.isEmpty(clonePayload)) {
                        cloneTasks.push(orchestratorService.editReplicationGroup(storageSystemId, replicationGroup.id,
                            clonePayload));
                    }
                    if ($scope.anyPrimaryVolumeSelected) {
                        var clonePayLoadPrimaryVolumeIds = [];
                        _.forEach($scope.dataModel.primaryVolumes, function (pv) {
                            if (pv.selected) {
                                clonePayLoadPrimaryVolumeIds.push(pv.id);
                            }
                        });
                        var clonePrimaryVolumeListPayload = {
                            primaryVolumeIds: clonePayLoadPrimaryVolumeIds,
                            deleteSecondaryVolume: $scope.dataModel.removeSecondaryVolume
                        };
                        cloneTasks.push(orchestratorService.unprotectReplicationGroup(storageSystemId,
                            replicationGroup.id, clonePrimaryVolumeListPayload));
                    }
                    $q.all(cloneTasks).then(function () {
                        window.history.back();
                    });
                }

                if ($scope.dataModel.replicationType === 'Snapshot') {
                    var snapshotTasks = [];
                    if ($scope.anyPrimaryVolumeSelected) {
                        var snapshotPayLoadPrimaryVolumeIds = [];
                        _.forEach($scope.dataModel.primaryVolumes, function (pv) {
                            if (pv.selected) {
                                snapshotPayLoadPrimaryVolumeIds.push(pv.id);
                            }
                        });
                        var snapshotPrimaryVolumeListPayload = {
                            primaryVolumeIds: snapshotPayLoadPrimaryVolumeIds,
                            deleteSecondaryVolume: $scope.dataModel.removeSecondaryVolume
                        };
                        snapshotTasks.push(orchestratorService.unprotectReplicationGroup(storageSystemId,
                            replicationGroup.id, snapshotPrimaryVolumeListPayload));
                    }

                    var snapshotPayload = {};
                    if ($scope.dataModel.replicationName && $scope.dataModel.replicationName !== replicationGroup.name) {
                        snapshotPayload.name = $scope.dataModel.replicationName;
                    }
                    if ($scope.dataModel.comments !== (replicationGroup.comments !== 'N/A' ?
                            replicationGroup.comments : '')) {
                        snapshotPayload.comments = $scope.dataModel.comments;
                    }
                    if ($scope.dataModel.numberOfSnapshots !== replicationGroup.numberOfCopies) {
                        snapshotPayload.numberOfCopies = $scope.dataModel.numberOfSnapshots;
                    }
                    var currentScheduleString = $scope.dataModel.schedule ?
                        cronStringConverterService.fromDatePickerToObjectModel($scope.dataModel.schedule.type,
                        $scope.dataModel.schedule.time, $scope.dataModel.schedule.date, $scope.dataModel.schedule.days,
                            $scope.dataModel.schedule.hourInterval,
                        $scope.dataModel.schedule.hourStartMinute) : null;
                    if (currentScheduleString !== null &&
                        !cronStringConverterService.isEqualForObjectModel(currentScheduleString,
                            replicationGroup.schedule)) {
                        snapshotPayload.schedule = currentScheduleString;
                    }

                    if (!_.isEmpty(snapshotPayload)) {
                        snapshotTasks.push(orchestratorService.editReplicationGroup(storageSystemId,
                            replicationGroup.id, snapshotPayload));
                    }
                    $q.all(snapshotTasks).then(function () {
                        window.history.back();
                    });
                }
            };

            function hasDaySelected(days) {
                var result = false;
                if (days === null || days === undefined) {
                    return false;
                }
                for (var day in days) {
                    if (days.hasOwnProperty(day)) {
                        if (days[day] === true) {
                            result = true;
                            break;
                        }
                    }
                }
                return result;
            }

            function isValidSchedule() {
                if (!$scope.dataModel.schedule || !$scope.dataModel.schedule.type) {
                    return false;
                }

                switch ($scope.dataModel.schedule.type) {
                    case 'HOURLY':
                        if (!$scope.dataModel.schedule.hourInterval || !$scope.validationForm.timePicker.hourInterval) {
                            return false;
                        }
                        if ($scope.dataModel.schedule.hourStartMinute === undefined ||
                            $scope.dataModel.schedule.hourStartMinute === null ||
                            !$scope.validationForm.timePicker.hourStartMinute) {
                            return false;
                        }
                        return !($scope.validationForm.timePicker.hourInterval.$invalid) &&
                            !($scope.validationForm.timePicker.hourStartMinute.$invalid);

                    case 'DAILY':
                        return $scope.dataModel.schedule.time ? true : false;
                    case 'WEEKLY':
                        return $scope.dataModel.schedule.time && ($scope.dataModel.schedule.days &&
                            hasDaySelected($scope.dataModel.schedule.days));
                    case 'MONTHLY':
                        if (!$scope.dataModel.schedule.date || !$scope.validationForm.timePicker.date) {
                            return false;
                        }
                        return $scope.dataModel.schedule.time && (!$scope.validationForm.timePicker.date.$invalid);
                    default:
                        return true;
                }
            }

            function canSubmitSnapshot() {
                if (!$scope.dataModel.replicationName || $scope.validationForm.rightPanel.numberOfSnapshots.$invalid) {
                    return false;
                }
                if ($scope.dataModel.schedule && $scope.dataModel.schedule.type &&
                    $scope.dataModel.schedule.type === 'MONTHLY' &&
                    $scope.validationForm.timePicker.date && $scope.validationForm.timePicker.date.$invalid) {
                    return false;
                }
                if ($scope.dataModel.schedule && $scope.dataModel.schedule.type &&
                    $scope.dataModel.schedule.type === 'HOURLY' &&
                    (($scope.validationForm.timePicker.hourStartMinute &&
                    $scope.validationForm.timePicker.hourStartMinute.$invalid) ||
                    ($scope.validationForm.timePicker.hourInterval &&
                    $scope.validationForm.timePicker.hourInterval.$invalid))) {
                    return false;
                }
                if ($scope.dataModel.schedule && $scope.dataModel.schedule.type &&
                    $scope.dataModel.schedule.type === 'WEEKLY' && !hasDaySelected($scope.dataModel.schedule.days)) {
                    return false;
                }
                var scheduleString = $scope.dataModel.schedule ?
                    cronStringConverterService.fromDatePickerToObjectModel($scope.dataModel.schedule.type,
                    $scope.dataModel.schedule.time, $scope.dataModel.schedule.date, $scope.dataModel.schedule.days,
                        $scope.dataModel.schedule.hourInterval,
                    $scope.dataModel.schedule.hourStartMinute) : replicationGroup.schedule;
                return $scope.dataModel.replicationName !== replicationGroup.name ||
                    $scope.dataModel.comments !== (replicationGroup.comments !== 'N/A' ?
                        replicationGroup.comments : '') ||
                    $scope.dataModel.numberOfSnapshots !== replicationGroup.numberOfCopies ||
                    (isValidSchedule() &&
                    !cronStringConverterService.isEqualForObjectModel(scheduleString, replicationGroup.schedule)) ||
                    $scope.anyPrimaryVolumeSelected;
            }
        }
    });
