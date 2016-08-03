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

        // Can't use css to truncate metadata if you reference a pre-defined SVG symbol using <use>. Talked with Jurgen
        // and Tuan, don't have time to refactor the whole thing, use javascript to do it.
        var truncateMessageOnISRDiagram = function (rgWithVolumeIdAsPvol, rgWithVolumeIdAsSvol, scope,
                                                    secondaryVolumeLabel, primaryVolumeLabel, copyGroupName) {
            var numberOfRgWithVolumeIdAsPvol = rgWithVolumeIdAsPvol.length;
            _.forEach(rgWithVolumeIdAsPvol, function (rgap) {
                rgap = truncateMessage(rgap, numberOfRgWithVolumeIdAsPvol);
            });
            if (rgWithVolumeIdAsSvol !== {}) {
                if (numberOfRgWithVolumeIdAsPvol !== 0) {
                    rgWithVolumeIdAsSvol = truncateMessage(rgWithVolumeIdAsSvol, 0);
                } else {
                    rgWithVolumeIdAsSvol = truncateMessage(rgWithVolumeIdAsSvol, 1);
                }
            }
            if (secondaryVolumeLabel !== undefined) {
                scope.displayedSecondaryVolumeLabel = truncateMessage(secondaryVolumeLabel);
            }
            if (primaryVolumeLabel !== undefined && copyGroupName !== undefined) {
                scope.displayedPrimaryVolumeLabel = truncateMessage(primaryVolumeLabel);
                scope.displayedCopyGroupName = truncateMessage(copyGroupName);
            }
        };


        var  truncateMessage = function (originalMessage, numberOfRgWithVolumeIdAsPvol) {
            var messageLength = originalMessage.length;
            var appendedMessage = '...';
            if (originalMessage instanceof  Object) {
                if (originalMessage.hasOwnProperty('name')) {
                    originalMessage.displayedName = generateTruncatedMessage(originalMessage.name, numberOfRgWithVolumeIdAsPvol, 'name');
                }
                if (originalMessage.hasOwnProperty('naturalLanguageSchedule')) {
                    originalMessage.displayedNaturalLanguageSchedule =
                        generateTruncatedMessage(originalMessage.naturalLanguageSchedule, numberOfRgWithVolumeIdAsPvol, 'schedule');
                }
                if (numberOfRgWithVolumeIdAsPvol === 1 && originalMessage.hasOwnProperty('comments')) {
                    originalMessage.displayedComments = generateTruncatedMessage(originalMessage.comments, numberOfRgWithVolumeIdAsPvol, 'comments');
                }
                if (originalMessage.hasOwnProperty('type')) {
                    originalMessage.displayedType = generateTruncatedMessage(originalMessage.type, numberOfRgWithVolumeIdAsPvol, 'type');
                }
            } else if ((typeof originalMessage === 'string' || originalMessage instanceof String) && messageLength > 13) {
                originalMessage = originalMessage.slice(0, 13) + appendedMessage;
            }
            return originalMessage;
        };

        var generateTruncatedMessage = function (message, size, type) {
            var messageLength = message.length;
            var appendedMessage = '...';
            switch (size) {
                case 0:
                    if (type === 'name' && messageLength > 14) {
                        message = message.slice(0, 14) + appendedMessage;
                    } else if ((type === 'schedule' || type === 'type') && messageLength > 16) {
                        message = message.slice(0, 16) + appendedMessage;
                    }
                    break;
                case 1:
                    if (type === 'name' && messageLength > 45) {
                        message = message.slice(0, 45) + appendedMessage;
                    } else if ((type === 'schedule' || type === 'type') && messageLength > 16) {
                        message = message.slice(0, 16) + appendedMessage;
                    } else if (type === 'comments' && messageLength > 24) {
                        message = message.slice(0, 24) + appendedMessage;
                    }
                    break;
                case 2:
                    if (type === 'name' && messageLength > 24) {
                        message = message.slice(0, 24) + appendedMessage;
                    } else if ((type === 'schedule' || type === 'type') && messageLength > 28) {
                        message = message.slice(0, 28) + appendedMessage;
                    }
                    break;
                case 3:
                    if (type === 'name' && messageLength > 14) {
                        message = message.slice(0, 14) + appendedMessage;
                    } else if ((type === 'schedule' || type === 'type') && messageLength > 18) {
                        message = message.slice(0, 18) + appendedMessage;
                    }
                    break;
                case 4:
                    if (type === 'name' && messageLength > 24) {
                        message = message.slice(0, 24) + appendedMessage;
                    } else if ((type === 'schedule' || type === 'type') && messageLength > 13) {
                        message = message.slice(0, 13) + appendedMessage;
                    }
                    break;
                case 5:
                    if (type === 'name' && messageLength > 12) {
                        message = message.slice(0, 12) + appendedMessage;
                    } else if ((type === 'schedule' || type === 'type') && messageLength > 13) {
                        message = message.slice(0, 13) + appendedMessage;
                    }
                    break;
                case 6:
                    if (type === 'name' && messageLength > 24) {
                        message = message.slice(0, 24) + appendedMessage;
                    } else if ((type === 'schedule' || type === 'type') && messageLength > 14) {
                        message = message.slice(0, 14) + appendedMessage;
                    }
                    break;
                case 7:
                    if (type === 'name' && messageLength > 12) {
                        message = message.slice(0, 12) + appendedMessage;
                    } else if ((type === 'schedule' || type === 'type') && messageLength > 12) {
                        message = message.slice(0, 12) + appendedMessage;
                    }
                    break;
            }
            return message;
        };

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
                    title: 'valid-number-of-snapshots',
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
                    sortField: '',
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
                $location.path(['/storage-systems/', storageSystemId, '/replication-groups/replication-group-action-confirmation'].join(''));
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
            scope.dataModel.restoreCheck = function () {
                var result = true;
                var anyReplicationGroupSelected = false;
                var nothingSelected = true;
                var selectedVolumePairs = [];
                var containsSnapshotFullcopy = false;
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
                                        var type = scope.dataModel.displayList[i].volumePairs[j].type;
                                        if (type === 'SNAPSHOT_FULLCOPY') {
                                            containsSnapshotFullcopy = true;
                                        }
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
                    scope.dataModel.enableRestore = result && !nothingSelected && !containsSnapshotFullcopy;
                }
            };
        };

        return {
            setReplicationGroupGridSettings: replicationGroupGridSettings,
            setReplicationGroupActions: replicationGroupActions,
            setDataModelFunctions: setDataModelFunctions,
            truncateMessageOnISRDiagram: truncateMessageOnISRDiagram
        };
    });
