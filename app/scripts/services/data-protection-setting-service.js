'use strict';

/**
 * @ngdoc service
 * @name rainierApp.dataProtectionSettingsService
 * @description
 * # dataProtectionSettingsService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('dataProtectionSettingsService', function(ShareDataService, orchestratorService, $location, $q) {

        var replicationGroupGridSettings = function(dataModel) {

            dataModel.gridSettings  = [
                {
                    title: 'replication-group-label-policy-name',
                    sizeClass: 'sixth',
                    sortField: 'name',
                    getDisplayValue: function (item) {
                        return item.name;
                    }
                },
                {
                    title: 'replication-group-label-technology',
                    sizeClass: 'twelfth',
                    sortField: 'type',
                    getDisplayValue: function (item) {
                        return item.type;
                    }
                },
                {
                    title: 'replication-group-label-consistency',
                    sizeClass: 'twelfth',
                    sortField: 'consistent',
                    getDisplayValue: function (item) {
                        return item.consistent;
                    }
                },
                {
                    title: 'replication-group-label-backups',
                    sizeClass: 'twelfth',

                    sortField: 'numberOfCopies',
                    getDisplayValue: function (item) {
                        return item.numberOfCopies;
                    }
                },
                {
                    title: 'replication-group-label-status',
                    sizeClass: 'twelfth',
                    sortField: 'scheduleEnabled',
                    getDisplayValue: function (item) {
                        return item.status;
                    }
                },
                {
                    title: 'replication-group-label-schedule',
                    sizeClass: 'sixth',
                    sortField: 'schedule.recurringUnit',
                    getDisplayValue: function (item) {
                        return item.naturalLanguageSchedule;
                    }
                },
                {
                    title: 'replication-group-label-comments',
                    sizeClass: 'sixth',
                    sortField: 'comments',
                    getDisplayValue: function (item) {
                        return item.comments;
                    }
                }
            ];
        };

        var replicationGroupActions = function (scope, storageSystemId) {

            scope.replicationGroupSuspendResumeDelete = function (replicationGroupAction, selectedReplicationGroup) {
                ShareDataService.replicationGroupAction = replicationGroupAction;
                ShareDataService.selectedReplicationGroup = selectedReplicationGroup;
                $location.path(['/storage-systems/', storageSystemId, '/replication-groups/replication-group-actions-confirmation'].join(''));
            };

            scope.replicationGroupRestore = function () {
                var selectedVps = [];
                _.forEach(scope.dataModel.displayList, function (rg) {
                    if (rg.volumePairs) {
                        _.forEach(rg.volumePairs, function (vp) {
                            if (vp.selected) {
                                selectedVps.push(vp);
                            }
                        });
                    }
                });
                var tasks = [];
                _.forEach (selectedVps, function (vp) {
                    var payload = {
                        secondaryVolumeId: vp.secondaryVolume.id.toString()
                    };
                    tasks.push(orchestratorService.restoreReplicationGroup(vp.primaryVolume.storageSystemId, vp.primaryVolume.id, payload));
                });
                $q.all(tasks);
            };

            scope.replicationGroupEdit = function (selectedReplicationGroup) {
                ShareDataService.selectedReplicationGroup = selectedReplicationGroup;
                $location.path(['/storage-systems/', storageSystemId, '/replication-groups/edit'].join(''));
            };
        };

        var setDataModelFunctions = function (scope) {

            //TODO: Display list? Check with David
            scope.dataModel.restoreCheck = function () {
                var result = true;
                var anyReplicationGroupSelected = false;
                var nothingSelected = true;
                var selectedVolumePairs = [];
                if (scope.dataModel.displayList) {
                        for (var i = 0; i < scope.dataModel.displayList.length; ++i) {
                            if (scope.dataModel.displayList[i].selected) {
                                anyReplicationGroupSelected = true;
                                result = false;
                            }
                            if (scope.dataModel.displayList[i].volumePairs) {
                                for (var j = 0; j < scope.dataModel.displayList[i].volumePairs.length; ++j) {
                                    if (scope.dataModel.displayList[i].volumePairs[j].selected) {
                                        nothingSelected = false;
                                        if (selectedVolumePairs.indexOf(scope.dataModel.displayList[i].volumePairs[j].primaryVolume.id) > -1 ||
                                            scope.dataModel.displayList[i].volumePairs[j].secondaryVolume.id === 'N/A') {
                                            result = false;
                                            break;
                                        } else {
                                            selectedVolumePairs.push(scope.dataModel.displayList[i].volumePairs[j].primaryVolume.id);
                                        }
                                    }
                                }
                            }
                        }
                    scope.dataModel.noVolumePairSelected = !(anyReplicationGroupSelected && !nothingSelected);
                    scope.dataModel.enableRestore = result && !nothingSelected;
                }
            };
        };

        return {
            setReplicationGroupGridSettings: replicationGroupGridSettings,
            setReplicationGroupActions: replicationGroupActions,
            setDataModelFunctions: setDataModelFunctions
        };
    });
