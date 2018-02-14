'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:HostCtrl
 * @description
 * # HostCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('HostCtrl', function ($scope, $routeParams, $window, $timeout, $location, orchestratorService,
                                      objectTransformService, scrollDataSourceBuilderService, ShareDataService,
                                      inventorySettingsService, storageSystemVolumeService, queryService,
                                      paginationService, scrollDataSourceBuilderServiceNew, volumeService,
                                      replicationService, gadVolumeTypeSearchService) {
        var hostId = $routeParams.hostId;
        var ATTACHED_VOLUMES_PATH = 'compute/servers/attached-volumes';
        var hostGroupsInStorageSystem = {};
        ShareDataService.showProvisioningStatus = false;
        var updateToggleId =  function (resources) {
            var id = 0;
            _.forEach(resources, function (r) {
                r.id = ++id;
            });
            return resources;
        };

        var volumeUnprotectActions = function (selectedVolume) {
            ShareDataService.volumeListForUnprotect = selectedVolume;

            $location.path(['hosts', hostId, 'unprotect'].join('/'));
        };
        $scope.dataModel = {};

        var volumeRestoreAction = function (action, selectedVolumes) {

            var volumeId = 0;
            if (selectedVolumes && selectedVolumes.length > 0) {
                volumeId = selectedVolumes[0].volumeId;
            }

            var storageSystemId = selectedVolumes[0].storageSystemId;
            ShareDataService.restoreStorageSystemId = storageSystemId;

            storageSystemVolumeService.getVolumePairsAsPVolWithoutSnapshotFullcopy(null, volumeId, storageSystemId).then(function (result) {

                ShareDataService.SVolsList = _.filter(result.resources, function (SVol) {
                    return SVol.primaryVolume && SVol.secondaryVolume;
                });
                ShareDataService.restorePrimaryVolumeId = volumeId;
                ShareDataService.restorePrimaryVolumeToken = result.nextToken;

                _.forEach(ShareDataService.SVolsList, function (volume) {
                    volume.selected = false;
                });
                $location.path(['/hosts/', hostId, '/volume-actions-restore-selection'].join(''));
            });
        };

        orchestratorService.host(hostId).then(function (host) {
            $scope.dataModel.host = host;
            orchestratorService.hostVolumes(host.serverId).then(function (result) {
                var totalVolumesCapacity = 0;
                var usedVolumesCapacity = 0;
                var availableVolumesCapacity = 0;
                _.forEach(result.dpVolResouce, function (volume) {
                    totalVolumesCapacity += volume.totalCapacity.value;
                    usedVolumesCapacity = usedVolumesCapacity + volume.usedCapacity.value;
                    availableVolumesCapacity = availableVolumesCapacity + volume.availableCapacity.value;
                });
                var summaryModel = objectTransformService.transformToHostSummaryModel(totalVolumesCapacity, usedVolumesCapacity, availableVolumesCapacity);
                summaryModel.title = 'Server ' + hostId;
                summaryModel.noBreakdown = true;
                orchestratorService.dpAlertsCountForHost(hostId).then(function (result) {
                    summaryModel.alerts.dp.count = result.volumeAlerts;
                    if (result.volumeAlerts !== 0) {
                        summaryModel.alerts.dp.level = 'error';
                    }
                    summaryModel.server = host;

                    summaryModel.getActions = function () {
                        return this.server.getActions();
                    };
                    $scope.summaryModel = summaryModel;
                    $scope.attachedVolumes = {};
                });
            });
            return Promise.resolve(host);
        }).then(function (host) {
            paginationService.clearQuery();
            queryService.setQueryMapEntry('serverId', parseInt(hostId));
            paginationService.get(null, ATTACHED_VOLUMES_PATH, objectTransformService.transformVolume, false).then(function (result) {
                getHostGroupsForStorageSystems(result);
                updateToggleId(result.resources);
                var dataModel = {
                    view: 'list',
                    hostId: hostId,
                    removeConnection: true,
                    hasDetach: true,
                    hasIconAndExpandingRows: true,
                    nextToken: result.nextToken,
                    total: result.total,
                    currentPageCount: 0,
                    busy: false,
                    sort: {
                        field: 'volumeId',
                        reverse: false,
                        setSort: function (f) {
                            $timeout(function () {
                                if ($scope.dataModel.sort.field === f) {
                                    queryService.setSort(f, !$scope.dataModel.sort.reverse);
                                    $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                                } else {
                                    $scope.dataModel.sort.field = f;
                                    queryService.setSort(f, false);
                                    $scope.dataModel.sort.reverse = false;
                                }
                                queryService.setQueryMapEntry('serverId', parseInt(hostId));
                                paginationService.getQuery(ATTACHED_VOLUMES_PATH, objectTransformService.transformVolume)
                                    .then(function (result) {
                                        updateResultTotalCounts(result);
                                    });
                            });
                        }
                    }
                };

                inventorySettingsService.setVolumesGridSettings(dataModel, {
                    canAdd: false
                });

                var zoneEnabled = host.protocol === 'FIBRE';

                var actions = [
                    {
                        icon: 'icon-edit',
                        tooltip: 'action-tooltip-edit',
                        type: 'link',
                        enabled: function () {
                            return dataModel.onlyOneSelected() &&
                                _.find(dataModel.getSelectedItems(), function(volume) {return isVolumeGADAware(volume);}) === undefined;
                        },
                        onClick: function () {
                            var item = _.first(dataModel.getSelectedItems());
                            item.actions.edit.onClick();

                        }
                    },
                    {
                        icon: 'icon-paths',
                        tooltip: 'action-tooltip-edit-lun-path',
                        type: 'link',
                        enabled: function () {
                            return isVolumesPartOfSameHostGroup(dataModel.getSelectedItems());
                        },
                        onClick: function () {
                            ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                            ShareDataService.push('selectedHost', [$scope.dataModel.host]);
                            $location.path(['volume-manager', 'edit-lun-path'].join(
                                '/'));
                        }
                    },
                    {
                        icon: 'icon-detach-volume',
                        tooltip: 'action-tooltip-detach-volumes',
                        type: 'confirmation-modal',
                        dialogSettings: {
                            id: 'detachVolumeConfirmation',
                            title: 'storage-volume-detach-confirmation',
                            content: 'storage-volume-detach-selected-content',
                            trueText: 'storage-volume-detach-remove-zone',
                            falseText: 'storage-volume-detach-not-remove-zone',
                            disableRadioButton: !zoneEnabled,
                            switchEnabled: {
                                value: false
                            }
                        },
                        enabled: function () {
                            return dataModel.anySelected() &&
                                _.find(dataModel.getSelectedItems(), function(volume) {return isVolumeGADAware(volume);}) === undefined;
                        },
                        confirmClick: function () {
                            $('#' + this.dialogSettings.id).modal('hide');
                            var enabled = zoneEnabled ? this.dialogSettings.switchEnabled.value : undefined;
                            _.forEach(dataModel.getSelectedItems(), function (volume) {

                                var detachVolumePayload = {
                                    storageSystemId: volume.storageSystemId,
                                    serverId: hostId,
                                    volumeId: volume.volumeId,
                                    removeConnection: enabled
                                };

                                orchestratorService.detachVolume(detachVolumePayload);
                            });
                        }
                    },
                    {
                        icon: 'icon-data-protection',
                        tooltip: 'action-tooltip-protect-volumes',
                        type: 'link',
                        onClick: function () {
                            ShareDataService.volumesList = dataModel.getSelectedItems();

                            $location.path('/hosts/' + hostId + '/protect');

                        },
                        enabled: function () {
                            return dataModel.anySelected();
                        }
                    },
                    {
                        icon: 'icon-migrate-volume',
                        tooltip: 'action-tooltip-migrate-volumes',
                        type: 'link',
                        enabled: function () {
                            // TODO NEWRAIN-8104: Enable or disable control.
                            return isVolumesInSameStorageSystemAndNotGADVolume(dataModel.getSelectedItems())
                                && !_.some(dataModel.getSelectedItems(), function (vol) {
                                        return !vol.isUnprotected();
                                    });
                        },
                        onClick: function () {
                            // Maximum number of volumes to migrate in one migration group is 300.
                            // TODO NEWRAIN-8104: If number of vols is over 300, what should be done?
                            ShareDataService.selectedMigrateVolumes = _.first(dataModel.getSelectedItems(), 300);
                            var storageSystemId = ShareDataService.selectedMigrateVolumes[0].storageSystemId;
                            $location.path(['storage-systems', storageSystemId, 'migrate-volumes'].join('/'));
                        }
                    },
                    {
                        icon: 'icon-remove-volume',
                        tooltip: 'action-tooltip-unprotect-volumes',
                        type: 'link',
                        onClick: function () {
                            volumeUnprotectActions(dataModel.getSelectedItems());
                        },
                        enabled: function () {
                            return dataModel.onlyOneSelected() && !_.some(dataModel.getSelectedItems(),
                                function (vol) {
                                    return vol.isUnprotected();
                                });
                        }
                    },
                    {
                        icon: 'icon-refresh',
                        tooltip: 'action-tooltip-restore-volumes',
                        type: 'link',
                        onClick: function () {
                            volumeRestoreAction('restore', dataModel.getSelectedItems());
                        },
                        enabled: function () {
                            return dataModel.onlyOneSelected() && _.some(dataModel.getSelectedItems(),
                                function (vol) {
                                    return volumeService.restorable(vol);
                                });
                        }
                    }
                ];

                dataModel.getActions = function () {
                    return actions;
                };

                dataModel.getResources = function () {
                    return paginationService.get($scope.dataModel.nextToken,
                        ATTACHED_VOLUMES_PATH, objectTransformService.transformVolume, false);
                };

                dataModel.cachedList = result.resources;
                dataModel.displayList = dataModel.cachedList.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                // In case the getHost call returns earlier than this backend api call, we should restore the "host".
                dataModel.host = $scope.dataModel.host;
                $scope.dataModel = dataModel;

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources);

            });
        });

        var getUniqueStorageSystemsForAttachedVolumes = function (attachedVolumesPerServer) {
            var uniqueStorageSystemIds = [];
            if (attachedVolumesPerServer !== null && attachedVolumesPerServer !== undefined &&
                attachedVolumesPerServer.resources !== null && attachedVolumesPerServer.resources !== undefined) {
                var attachedVolumes = attachedVolumesPerServer.resources;
                for (var i = 0; i < attachedVolumes.length; i++) {
                    var storageSystemId = attachedVolumes[i].storageSystemId;
                    if ($.inArray(storageSystemId, uniqueStorageSystemIds) === -1) {
                        uniqueStorageSystemIds.push(storageSystemId);
                    }
                }
            }
            return uniqueStorageSystemIds;
        };

        var getHostGroupsForStorageSystems = function (attachedVolumesPerServer) {
            var uniqueStorageSystemIds = getUniqueStorageSystemsForAttachedVolumes (attachedVolumesPerServer);
            for (var i = 0; i < uniqueStorageSystemIds.length; i++) {
                getHostGroupsForStorageSystem(uniqueStorageSystemIds[i]);
            }
        };

        var getHostGroupsForStorageSystem = function (storageSystemId) {
            paginationService.clearQuery();
            paginationService.getAllPromises(null, 'host-groups', false, storageSystemId, null, false).then(function(hostGroupResults) {
                hostGroupsInStorageSystem[storageSystemId] = hostGroupResults;
            });
        };

        var isVolumesInSameStorageSystemAndNotGADVolume = function (selectedVolumes) {
            if (selectedVolumes !== null && selectedVolumes !== undefined && selectedVolumes.length > 0 && !isVolumeGADAware(selectedVolumes[0])) {
                var storageSystemId = selectedVolumes[0].storageSystemId;
                for (var i = 1; i < selectedVolumes.length; i++) {
                    var selectedVolume = selectedVolumes[i];
                    if (storageSystemId !== selectedVolume.storageSystemId || isVolumeGADAware(selectedVolume)) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };

        var isVolumeGADAware = function (selectedVolume) {
            var gadVolumeTypes = ['ACTIVE_PRIMARY', 'ACTIVE_SECONDARY'];
            var gadSummary = selectedVolume.gadSummary;
            if (gadSummary !== null && gadSummary !== undefined && $.inArray(gadSummary.volumeType, gadVolumeTypes) > -1) {
                return true;
            }
            return false;
        };

        var getvolumeIdLunIdMap = function (lunsInHostGroup) {
            var volumeIdLunIdMap = {};
            if (lunsInHostGroup !== null && lunsInHostGroup !== undefined && lunsInHostGroup.length > 0) {
                for (var j = 0; j < lunsInHostGroup.length; j++) {
                    var lunInfo = lunsInHostGroup[j];
                    volumeIdLunIdMap[lunInfo.volumeId] = lunInfo.lun;
                }
            }
            return volumeIdLunIdMap;
        };

        var findMatchVolume = function (hostGroup, selectedVolumes, volumeIdHostGroupMap) {
            var volumeIdLunIdMap = getvolumeIdLunIdMap(hostGroup.luns);
            _.forEach(selectedVolumes, function(volume) {
                if (volumeIdLunIdMap.hasOwnProperty(volume.volumeId)) {
                    if (volumeIdHostGroupMap.hasOwnProperty(volume.volumeId)){
                        volumeIdHostGroupMap[volume.volumeId].push(hostGroup);
                    } else {
                        volumeIdHostGroupMap[volume.volumeId] = [hostGroup];
                    }
                }
            });
        };

        var isVolumesPartOfSameHostGroup = function (selectedVolumes) {
            if (isVolumesInSameStorageSystemAndNotGADVolume(selectedVolumes)) {
                var volumeIdHostGroupMap = {};
                var i;
                var j;
                var hostGroups;
                var storageSystemId = selectedVolumes[0].storageSystemId;
                var firstVolumeHostGroups;
                var otherVolumeHostGroups;
                var hostGroupIdHashSet = {};
                if (hostGroupsInStorageSystem.hasOwnProperty(storageSystemId)) {
                    hostGroups = hostGroupsInStorageSystem[storageSystemId];
                    for (j = 0; j < hostGroups.length; j++) {
                        findMatchVolume(hostGroups[j], selectedVolumes, volumeIdHostGroupMap);
                    }

                    if (!_.isEmpty(volumeIdHostGroupMap)) {
                        if (selectedVolumes.length === 1){
                            return true;
                        }

                        firstVolumeHostGroups = volumeIdHostGroupMap[selectedVolumes[0].volumeId];
                        _.forEach(firstVolumeHostGroups, function(hostGroup) {
                            hostGroupIdHashSet[hostGroup.hostGroupId] = true;
                        });
                        for (i = 1; i < selectedVolumes.length; ++i) {
                            otherVolumeHostGroups = volumeIdHostGroupMap[selectedVolumes[i].volumeId];
                            if (otherVolumeHostGroups.length !== firstVolumeHostGroups.length) {
                                return false;
                            } else {
                                for (j = 0; j< otherVolumeHostGroups.length; ++j){
                                    if (!hostGroupIdHashSet.hasOwnProperty(otherVolumeHostGroups[j].hostGroupId)){
                                        return false;
                                    }
                                }

                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        };

        var updateResultTotalCounts = function (result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = updateToggleId(result.resources);
            $scope.dataModel.displayList = $scope.dataModel.cachedList.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        $scope.filterModel = {
            $replicationRawTypes: replicationService.rawTypes,
            filter: {
                freeText: '',
                volumeType: '',
                previousVolumeType: '',
                replicationType: [],
                protectionStatusList: [],
                snapshot: false,
                clone: false,
                protected: false,
                unprotected: false,
                secondary: false,
                gadActivePrimary: false,
                gadActiveSecondary: false,
                gadNotAvailable: false,
                freeCapacity: {
                    min: 0,
                    max: 1000,
                    unit: 'PB'
                },
                totalCapacity: {
                    min: 0,
                    max: 1000,
                    unit: 'PB'
                },
                utilization: {
                    min: 0,
                    max: 100
                }
            },
            fetchPreviousVolumeType: function (previousVolumeType) {
                $scope.filterModel.filter.previousVolumeType = previousVolumeType;
            },
            arrayType: (new paginationService.SearchType()).ARRAY,
            filterQuery: function (key, value, type, arrayClearKey) {
                gadVolumeTypeSearchService.filterQuery(key, value, type, arrayClearKey, $scope.filterModel);
                queryService.setQueryMapEntry('serverId', parseInt(hostId));
                paginationService.getQuery(ATTACHED_VOLUMES_PATH, objectTransformService.transformVolume).then(function (result) {
                        updateResultTotalCounts(result);
                });
            },
            sliderQuery: function(key, start, end, unit) {
                paginationService.setSliderSearch(key, start, end, unit);
                queryService.setQueryMapEntry('serverId', parseInt(hostId));
                paginationService.getQuery(ATTACHED_VOLUMES_PATH, objectTransformService.transformVolume).then(function (result) {
                    updateResultTotalCounts(result);
                });
            },
            searchQuery: function (value) {
                var queryObjects = [];
                queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().INT, value));
                queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                paginationService.setTextSearch(queryObjects);
                queryService.setQueryMapEntry('serverId', parseInt(hostId));
                paginationService.getQuery(ATTACHED_VOLUMES_PATH, objectTransformService.transformVolume).then(function (result) {
                    updateResultTotalCounts(result);
                });
            }
        };

    });
