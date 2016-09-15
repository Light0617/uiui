'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumeCtrl
 * @description
 * # StorageSystemVolumeCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemVolumeCtrl', function ($scope, $routeParams, $timeout, $window, $location, orchestratorService,
                                                     synchronousTranslateService, objectTransformService, ShareDataService,
                                                     scrollDataSourceBuilderService, dataProtectionSettingsService, replicationService,
                                                     replicationGroupsService, storageSystemVolumeService, paginationService, resourceTrackerService) {
        var storageSystemId = $routeParams.storageSystemId;
        var volumeId = $routeParams.volumeId;
        $scope.volumeId = volumeId;
        $scope.protected = false;
        $scope.noRgWithVolumeIdAsPvol = false;
        $scope.noRgWithVolumeIdAsPvolAndClone = false;
        $scope.noRgWithVolumeIdAsPvolAndSnaphot = false;
        $scope.noRgWithVolumeIdAsPvolAndExternalSnaphot = false;
        $scope.noGadRgWithVolmeIdAsPvolAndSvol = false;
        $scope.noRgWithVolumeIdAsSvol = false;
        $scope.noDataVisualization = false;
        $scope.numberOfVPWithVolumeIdAsPvol = 0;
        $scope.volumePairsAsSvol = [];
        $scope.rgWithVolumeIdAsPvol = [];
        $scope.rgWithVolumeIdAsSvol = {};

        orchestratorService.volume(storageSystemId, volumeId).then(function (result) {

            var summaryModel = objectTransformService.transformToVolumeSummaryModel(result);
            summaryModel.title = 'Storage volume ' + volumeId;

            $scope.summaryModel = summaryModel;
            result.orchestratorService = orchestratorService;
            $scope.alertModel = result;
            $scope.model = result;
            var HEALTHY_LEVEL = 'healthy';
            var UNHEALTHY_LEVEL = 'error';

            $scope.alertCount = result.dataProtectionSummary.secondaryVolumeFailures;
            $scope.alertModel.alertCount = result.dataProtectionSummary.secondaryVolumeFailures;
            $scope.alertModel.alertLevel = $scope.alertModel.alertCount !== '0' && $scope.alertModel.alertCount !== 0 ? UNHEALTHY_LEVEL : HEALTHY_LEVEL;

            if (_.contains($scope.alertModel.dataProtectionSummary.volumeType, 'P-VOL')) {
                $scope.protected = true;
            } else {
                $scope.protected = false;
            }

            if (result.poolId !== null && result.poolId !== undefined) {
                orchestratorService.storagePool(storageSystemId, result.poolId).then(function (result) {
                    result.displayType = synchronousTranslateService.translate(result.type);
                    $scope.model.storagePool = result;
                });
            }

            $scope.protectCurrentVolume = function () {
                ShareDataService.volumesList = [result];

                $location.path(['storage-systems', storageSystemId, 'volumes', result.volumeId, 'protect'].join('/'));
            };

            $scope.unprotectCurrentVolume = function () {
                ShareDataService.volumeListForUnprotect = [result];

                $location.path(['storage-systems', storageSystemId, 'volumes', result.volumeId, 'unprotect'].join('/'));
            };

            $scope.deleteConfirmOk = function () {
                // Build reserved resources
                var reservedResourcesList = [];
                var volIds = [$scope.model.volumeId];
                reservedResourcesList.push($scope.model.volumeId + '=' + resourceTrackerService.volume());

                // Show popup if resource is present in resource tracker else submit
                resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                    'Delete Volume Confirmation', $scope.model.storageSystemId, volIds, null, orchestratorService.deleteVolume);
            };

            $scope.attachToHost = function () {
                ShareDataService.push('selectedVolumes', [$scope.model]);
                $location.path('storage-systems/' + $scope.model.storageSystemId + '/attach-volumes');
            };
        });

        storageSystemVolumeService.getVolumePairsAsSVol(volumeId, storageSystemId).then(function (result) {
            if (result.total) {
                $scope.volumePairsAsSvol = result.resources;
                $scope.noRgWithVolumeIdAsSvol = false;
                return orchestratorService.volume(storageSystemId, _.first($scope.volumePairsAsSvol).primaryVolume.id).then(function (result) {
                    $scope.model.primaryVolumeLabel = result.label;
                    var replicationGroupAsSVolName = _.first($scope.volumePairsAsSvol).replicationGroup;
                    if (replicationGroupAsSVolName === 'N/A') {
                        var technologyName = replicationService.displayReplicationType(_.first($scope.volumePairsAsSvol).type.toString());
                        $scope.rgWithVolumeIdAsSvol = new replicationGroupsService.ExternalReplicationGroup(technologyName);
                        $scope.rgWithVolumeIdAsSvol.volumePairsAsSvol = $scope.volumePairsAsSvol;
                        return storageSystemVolumeService.getVolumePairsAsPVolAndClone(volumeId, storageSystemId);
                    } else {
                        return storageSystemVolumeService.getReplicationGroupByName(replicationGroupAsSVolName, storageSystemId).then(function (result) {
                            $scope.rgWithVolumeIdAsSvol = _.first(result.resources);
                            $scope.rgWithVolumeIdAsSvol.volumePairsAsSvol = $scope.volumePairsAsSvol;
                            return storageSystemVolumeService.getVolumePairsAsPVolAndClone(volumeId, storageSystemId);
                        });
                    }
                });
            } else {
                $scope.noRgWithVolumeIdAsSvol = true;
                return storageSystemVolumeService.getVolumePairsAsPVolAndClone(volumeId, storageSystemId);
            }
        }).then(function (result) {
            $scope.numberOfVPWithVolumeIdAsPvol += result.total;
            if (result.total) {
                $scope.noRgWithVolumeIdAsPvolAndClone = false;
                var generateExternalCloneRG = false;
                var cloneRGNames = [];
                _.forEach(result.resources, function (vp) {
                    if (vp.replicationGroup === 'N/A') {
                        generateExternalCloneRG = true;
                    } else {
                        cloneRGNames.push(vp.replicationGroup);
                    }
                });
                if (generateExternalCloneRG) {
                    $scope.rgWithVolumeIdAsPvol.push(new replicationGroupsService.ExternalReplicationGroup('Clone'));
                }
                if (!_.isEmpty(cloneRGNames)) {
                    return storageSystemVolumeService.getMultipleReplicationGroupsByName(cloneRGNames, storageSystemId).then(function (result) {
                        $scope.rgWithVolumeIdAsPvol = $scope.rgWithVolumeIdAsPvol.concat(result.resources);
                        return storageSystemVolumeService.getVolumePairsAsPVolAndSnapshotAndRGNameExisting(volumeId, storageSystemId);
                    });
                } else {
                    return storageSystemVolumeService.getVolumePairsAsPVolAndSnapshotAndRGNameExisting(volumeId, storageSystemId);
                }
            } else {
                $scope.noRgWithVolumeIdAsPvolAndClone = true;
                return storageSystemVolumeService.getVolumePairsAsPVolAndSnapshotAndRGNameExisting(volumeId, storageSystemId);
            }
        }).then(function (result) {
            $scope.numberOfVPWithVolumeIdAsPvol += result.total;
            if (result.total) {
                $scope.noRgWithVolumeIdAsPvolAndSnaphot = false;
                var replicationGroupAsPVolName = _.first(result.resources).replicationGroup;
                return storageSystemVolumeService.getReplicationGroupByName(replicationGroupAsPVolName, storageSystemId).then(function (result) {
                    $scope.rgWithVolumeIdAsPvol.push(_.first(result.resources));
                    return storageSystemVolumeService.getVolumePairsAsPVolAndSnapshotAndRGNameMissing(volumeId, storageSystemId);
                });
            } else {
                $scope.noRgWithVolumeIdAsPvolAndSnaphot = true;
                return storageSystemVolumeService.getVolumePairsAsPVolAndSnapshotAndRGNameMissing(volumeId, storageSystemId);
            }
        }).then(function (result) {
            $scope.numberOfVPWithVolumeIdAsPvol += result.total;
            if (result.total) {
                $scope.noRgWithVolumeIdAsPvolAndExternalSnaphot = false;
                $scope.rgWithVolumeIdAsPvol.push(new replicationGroupsService.ExternalReplicationGroup('Snap'));
            } else {
                $scope.noRgWithVolumeIdAsPvolAndExternalSnaphot = true;
            }
            return storageSystemVolumeService.getVolumePairsAsPVolAndSnapshotExtendableAndRGNameMissing(volumeId, storageSystemId);
        }).then(function (result) {
            $scope.numberOfVPWithVolumeIdAsPvol += result.total;
            if (result.total) {
                $scope.noRgWithVolumeIdAsPvolAndExternalSnaphotExtendable = false;
                $scope.rgWithVolumeIdAsPvol.push(new replicationGroupsService.ExternalReplicationGroup('Snap on Snap'));
            } else {
                $scope.noRgWithVolumeIdAsPvolAndExternalSnaphotExtendable = true;
            }
            return storageSystemVolumeService.getVolumePairsAsPVolAndSnapshotFullcopyAndRGNameMissing(volumeId, storageSystemId);
        }).then(function (result) {
            $scope.numberOfVPWithVolumeIdAsPvol += result.total;
            if (result.total) {
                $scope.noRgWithVolumeIdAsPvolAndExternalSnaphotFullcopy = false;
                $scope.rgWithVolumeIdAsPvol.push(new replicationGroupsService.ExternalReplicationGroup('Snap Clone'));
            } else {
                $scope.noRgWithVolumeIdAsPvolAndExternalSnaphotFullcopy = true;
            }
            return storageSystemVolumeService.getGadVolumePairsAsPVolAndSvol(null, volumeId, storageSystemId);
        }).then(function (result) {
            if (result.total) {
                $scope.noGadRgWithVolmeIdAsPvolAndSvol = false;
                $scope.rgWithVolumeIdAsPvol.push(new replicationGroupsService.ExternalReplicationGroup('GAD'));
            } else {
                $scope.noGadRgWithVolmeIdAsPvolAndSvol = true;
            }


            if ($scope.noRgWithVolumeIdAsSvol) {
                dataProtectionSettingsService.truncateMessageOnISRDiagram($scope.rgWithVolumeIdAsPvol, $scope.rgWithVolumeIdAsSvol,
                    $scope, $scope.model.label);
            } else {
                dataProtectionSettingsService.truncateMessageOnISRDiagram($scope.rgWithVolumeIdAsPvol, $scope.rgWithVolumeIdAsSvol,
                    $scope, $scope.model.label, $scope.model.primaryVolumeLabel, $scope.rgWithVolumeIdAsSvol.volumePairsAsSvol[0].volumePairGroup);
            }

            $scope.noRgWithVolumeIdAsPvol = $scope.noRgWithVolumeIdAsPvolAndClone && $scope.noRgWithVolumeIdAsPvolAndSnaphot &&
                $scope.noRgWithVolumeIdAsPvolAndExternalSnaphot && $scope.noRgWithVolumeIdAsPvolAndExternalSnaphotExtendable &&
                $scope.noRgWithVolumeIdAsPvolAndExternalSnaphotFullcopy && $scope.noGadRgWithVolmeIdAsPvolAndSvol;

            $scope.rgWithVolumeIdAsPvol = _.sortBy($scope.rgWithVolumeIdAsPvol, 'id');

            $scope.numberOfRgWithVolumeIdAsPvol = $scope.rgWithVolumeIdAsPvol.length.toString();


            if (($scope.noRgWithVolumeIdAsPvol && $scope.noRgWithVolumeIdAsSvol) || ($scope.rgWithVolumeIdAsPvol.length > 7)) {
                $scope.noDataVisualization = true;
            }

            var baseRightIconString = '#tile-';
            var defaultLeftIconString = '#tile-left-default-';
            var longLeftIconString = '#tile-left-long-';
            if (!$scope.noRgWithVolumeIdAsPvol && !$scope.noRgWithVolumeIdAsSvol) {
                switch ($scope.numberOfRgWithVolumeIdAsPvol) {
                    case '1':
                        baseRightIconString = baseRightIconString + 'single-';
                        break;
                    case '2':
                        baseRightIconString = baseRightIconString + 'half-';
                        break;
                    case '3':
                        baseRightIconString = baseRightIconString + 'third-';
                        break;
                    case '4':
                        baseRightIconString = baseRightIconString + 'quarter-';
                        break;
                    case '5':
                        baseRightIconString = baseRightIconString + 'fifth-';
                        break;
                    case '6':
                        baseRightIconString = baseRightIconString + 'sixth-';
                        break;
                    case '7':
                        baseRightIconString = baseRightIconString + 'seventh-';
                        break;
                }
            } else if ($scope.noRgWithVolumeIdAsSvol && !$scope.noRgWithVolumeIdAsPvol) {
                switch ($scope.numberOfRgWithVolumeIdAsPvol) {
                    case '1':
                        baseRightIconString = baseRightIconString + 'single-long-';
                        break;
                    case '2':
                        baseRightIconString = baseRightIconString + 'half-long-';
                        break;
                    case '3':
                        baseRightIconString = baseRightIconString + 'third-long-';
                        break;
                    case '4':
                        baseRightIconString = baseRightIconString + 'quarter-long-';
                        break;
                    case '5':
                        baseRightIconString = baseRightIconString + 'fifth-long-';
                        break;
                    case '6':
                        baseRightIconString = baseRightIconString + 'sixth-long-';
                        break;
                    case '7':
                        baseRightIconString = baseRightIconString + 'seventh-long-';
                        break;
                }
            }
            _.forEach($scope.rgWithVolumeIdAsPvol, function (rgsp) {
                if (replicationService.isSnap(rgsp.type)) {
                    rgsp.icon = baseRightIconString + 'scheduled-active';
                } else {
                    rgsp.icon = baseRightIconString + 'not-scheduled-active';
                }
            });
            if ($scope.rgWithVolumeIdAsSvol &&
                replicationService.isSnap($scope.rgWithVolumeIdAsSvol.type)) {
                $scope.defaultLeftIconString = defaultLeftIconString + 'scheduled-active';
                $scope.longLeftIconString = longLeftIconString + 'scheduled-active';
            } else if ($scope.rgWithVolumeIdAsSvol) {
                $scope.defaultLeftIconString = defaultLeftIconString + 'not-scheduled-active';
                $scope.longLeftIconString = longLeftIconString + 'not-scheduled-active';
            }

            $scope.jumpToReplicationGroup = function (id) {
                _.forEach($scope.rgWithVolumeIdAsPvol, function (rgap) {
                    var previousIconWithoutStatus = rgap.icon.slice(0, rgap.icon.lastIndexOf('-') + 1);
                    if (rgap.id === id) {
                        var previousIconStatus = rgap.icon.slice(rgap.icon.lastIndexOf('-') + 1, rgap.icon.length);
                        rgap.volumePairs = [];
                        if (previousIconStatus === 'active') {
                            rgap.icon = previousIconWithoutStatus + 'normal';
                            rgap.opened = true;
                            $scope.dataModel.fetchFirstPageChildren(rgap);
                            $('html, body').animate({
                                scrollTop: $('#' + id).offset().top
                            }, 1250);
                        } else if (previousIconStatus === 'normal') {
                            rgap.icon = previousIconWithoutStatus + 'active';
                            rgap.opened = false;
                        }
                    } else {
                        rgap.icon = previousIconWithoutStatus + 'active';
                        rgap.opened = false;
                        rgap.volumePairs = [];
                    }
                });
            };
            $scope.changeReplicationGroupBackground = function (item) {

                if (item.opened) {
                    _.forEach($scope.rgWithVolumeIdAsPvol, function (rgap) {
                        rgap.volumePairs = [];
                        if (rgap.id === item.id) {
                            rgap.icon = rgap.icon.slice(0, rgap.icon.lastIndexOf('-') + 1) + 'normal';
                            $scope.dataModel.fetchFirstPageChildren(item);
                        } else {
                            rgap.icon = rgap.icon.slice(0, rgap.icon.lastIndexOf('-') + 1) + 'active';
                            rgap.opened = false;
                        }
                    });
                } else {
                    _.forEach($scope.rgWithVolumeIdAsPvol, function (rgap) {
                        if (rgap.id === item.id) {
                            rgap.icon = rgap.icon.slice(0, rgap.icon.lastIndexOf('-') + 1) + 'active';
                            rgap.volumePairs = [];
                        }
                    });
                }
            };
            $scope.changeReplicationGroupIcon = function (id) {
                _.forEach($scope.rgWithVolumeIdAsPvol, function (rgap) {
                    if (rgap.id === id) {
                        var previousIconWithoutStatus = rgap.icon.slice(0, rgap.icon.lastIndexOf('-') + 1);
                        var previousIconStatus = rgap.icon.slice(rgap.icon.lastIndexOf('-') + 1, rgap.icon.length);
                        if (previousIconStatus === 'active') {
                            rgap.icon = previousIconWithoutStatus + 'normal';
                        } else if (previousIconStatus === 'normal') {
                            rgap.icon = previousIconWithoutStatus + 'active';
                        }
                    }
                });
            };

            var dataModel = {
                storageSystemId: storageSystemId,
                view: 'list',
                replicationGroups: $scope.rgWithVolumeIdAsPvol,
                enableRestore: false,
                noVolumePairSelected: true,
                childrenToken: null,
                busyLoadingMoreChildren: false,
                // Different APIs, have to separate this.
                gadChildrenToken: null,
                busyLoadingMoreGadChildren: false,
                search: {
                    freeText: '',
                    type: ''
                },
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
                },
                fetchFirstPageChildren: function (item) {
                    if(item.type === 'GAD') {
                        storageSystemVolumeService.getGadVolumePairsAsPVolAndSvol(null, volumeId, storageSystemId).then(function(result){
                            _.forEach (result.resources, function (item) {
                                objectTransformService.transformGadPair(item);
                            });
                            item.volumePairs = result.resources;
                            $scope.dataModel.gadChildrenToken = result.nextToken;
                        });
                    } else {
                        replicationGroupsService.getVolumePairsForOneReplicationGroup(null, storageSystemId, item, volumeId)
                            .then(function (result){
                                _.forEach (result.resources, function (item) {
                                    objectTransformService.transformVolumePairs(item);
                                });
                                item.volumePairs = result.resources;
                                $scope.dataModel.childrenToken = result.nextToken;
                            });
                    }

                    paginationService.clearQuery();
                },
                loadMoreChildren: function (item) {
                    if (item.type === 'GAD' && item.hasOwnProperty('volumePairs') && item.volumePairs.length >= paginationService.PAGE_SIZE &&
                    $scope.dataModel.gadChildrenToken !== null && !$scope.dataModel.busyLoadingMoreGadChildren) {
                        $scope.busyLoadingMoreGadChildren =true;
                        storageSystemVolumeService.getGadVolumePairsAsPVolAndSvol($scope.dataModel.gadChildrenToken, volumeId, storageSystemId).then(function(result){
                            _.forEach (result.resources, function (item) {
                                objectTransformService.transformGadPair(item);
                            });
                            item.volumePairs = result.resources;
                            $scope.dataModel.gadChildrenToken = result.nextToken;
                            setTimeout(function() {
                                $scope.dataModel.busyLoadingMoreGadChildren = false;
                                $scope.$apply();
                            }, 1000);
                        });
                    } else if (item.hasOwnProperty('volumePairs') && item.volumePairs.length >= paginationService.PAGE_SIZE &&
                        $scope.dataModel.childrenToken !== null && !$scope.dataModel.busyLoadingMoreChildren) {
                        $scope.dataModel.busyLoadingMoreChildren = true;
                        replicationGroupsService.getVolumePairsForOneReplicationGroup($scope.dataModel.childrenToken, storageSystemId, item, volumeId).then(function (result) {
                                _.forEach (result.resources, function (item) {
                                    objectTransformService.transformVolumePairs(item);
                                });
                                item.volumePairs = item.volumePairs.concat(result.resources);
                                $scope.dataModel.childrenToken = result.nextToken;
                                //Add a short time delay to avoid multiple backend calls
                                setTimeout(function() {
                                    $scope.dataModel.busyLoadingMoreChildren = false;
                                    // Need to trigger digest loop manually inside setTimeout
                                    $scope.$apply();
                                }, 1000);
                        });
                    }
                }
            };

            var actions = [
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit-replication-groups',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && dataModel.noVolumePairSelected;
                    },
                    onClick: function () {
                        $scope.replicationGroupEdit(dataModel.getSelectedItems());
                    }
                },
                {
                    icon: 'icon-pause',
                    tooltip: 'action-tooltip-suspend-replication-groups',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && dataModel.noVolumePairSelected;
                    },
                    onClick: function () {
                        $scope.replicationGroupSuspendResumeDelete('suspend', dataModel.getSelectedItems());
                    },
                },
                {
                    icon: 'icon-play',
                    tooltip: 'action-tooltip-resume-replication-groups',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && dataModel.noVolumePairSelected;
                    },
                    onClick: function () {
                        $scope.replicationGroupSuspendResumeDelete('resume', dataModel.getSelectedItems());
                    },
                },
                {
                    icon: 'icon-delete',
                    tooltip: 'action-tooltip-delete-replication-groups',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && dataModel.noVolumePairSelected;
                    },
                    onClick: function () {
                        $scope.replicationGroupSuspendResumeDelete('delete', dataModel.getSelectedItems());
                    },
                },
                {
                    icon: 'icon-refresh',
                    tooltip: 'action-tooltip-restore-replication-groups',
                    type: 'confirm',
                    confirmTitle: 'replication-group-actions-restore-confirmation-title',
                    confirmMessage: 'replication-group-actions-restore-confirmation-message',
                    onClick: function () {
                        $scope.replicationGroupRestore();
                    },
                    enabled: function () {
                        return !dataModel.anySelected() && dataModel.enableRestore;
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };
            dataProtectionSettingsService.setReplicationGroupGridSettings(dataModel);
            $scope.dataModel = dataModel;
            scrollDataSourceBuilderService.setupDataLoader($scope, $scope.rgWithVolumeIdAsPvol, 'replicationGroupsSearch');
            dataProtectionSettingsService.setDataModelFunctions($scope, $scope.rgWithVolumeIdAsPvol);
            dataProtectionSettingsService.setReplicationGroupActions($scope, storageSystemId);
        });
    });
