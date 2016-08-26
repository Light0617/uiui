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
                                      paginationService, scrollDataSourceBuilderServiceNew, volumeService) {
        var hostId = $routeParams.hostId;
        var ATTACHED_VOLUMES_PATH = 'compute/servers/attached-volumes';
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

            var totalVolumesCapacity = 0;
            var usedVolumesCapacity = 0;
            var availableVolumesCapacity = 0;
            $scope.dataModel.host = host;
            orchestratorService.hostVolumes(host.serverId).then(function (result) {
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
        });

        paginationService.clearQuery();
        queryService.setQueryMapEntry('serverId', parseInt(hostId));
        paginationService.get(null, ATTACHED_VOLUMES_PATH, objectTransformService.transformVolume, false).then(function (result) {
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

            var actions = [
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected();
                    },
                    onClick: function () {
                        var item = _.first(dataModel.getSelectedItems());
                        item.actions.edit.onClick();

                    }
                },
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit-lun-path',
                    type: 'link',
                    enabled: function () {
                        //TODO: there should be a validation to check whether the selected volumes are from the same host group
                        return dataModel.onlyOneSelected();
                    },
                    onClick: function () {
                        ShareDataService.push('selectedVolumes', dataModel.getSelectedItems());
                        ShareDataService.push('selectedHost', dataModel.getSelectedItems());
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
                        switchEnabled: {
                            value: false
                        }
                    },
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    confirmClick: function () {
                        $('#' + this.dialogSettings.id).modal('hide');
                        var enabled = this.dialogSettings.switchEnabled.value;
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
            $scope.dataModel = dataModel;
            angular.extend($scope.dataModel, dataModel);
            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources);

        });
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
            filter: {
                freeText: '',
                volumeType: '',
                replicationType: [],
                protectionStatusList: [],
                snapshot: false,
                gad: false,
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
            arrayType: (new paginationService.SearchType()).ARRAY,
            filterQuery: function (key, value, type, arrayClearKey) {
                var queryObject;
                // This is used when you need to use 1 click/button to query more than 1 possibilities on 1 attribute.
                if (value instanceof Array && arrayClearKey instanceof Array) {
                    for (var queryParameterIndex = 0 ; queryParameterIndex < value.length; ++queryParameterIndex) {
                        if ($scope.filterModel.filter.gadActivePrimary && key === 'gadSummary.volumeType' &&
                            arrayClearKey[queryParameterIndex] === 'Active-Primary') {
                            continue;
                        }
                        if ($scope.filterModel.filter.gadActiveSecondary && key === 'gadSummary.volumeType' &&
                            arrayClearKey[queryParameterIndex] === 'Active-Secondary') {
                            continue;
                        }

                        queryObject =
                            new paginationService.QueryObject(key, type, value[queryParameterIndex], arrayClearKey[queryParameterIndex]);
                        paginationService.setFilterSearch(queryObject);
                    }
                } else {
                    if (!($scope.filterModel.filter.gad && key === 'gadSummary.volumeType' &&
                        (arrayClearKey === 'Active-Primary' || arrayClearKey === 'Active-Secondary'))) {
                        queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                        paginationService.setFilterSearch(queryObject);
                    }
                }
                paginationService.getQuery(ATTACHED_VOLUMES_PATH, objectTransformService.transformVolume).then(function (result) {
                        updateResultTotalCounts(result);
                });
            },
            sliderQuery: function(key, start, end, unit) {
                paginationService.setSliderSearch(key, start, end, unit);
                paginationService.getQuery(ATTACHED_VOLUMES_PATH, objectTransformService.transformVolume).then(function (result) {
                    updateResultTotalCounts(result);
                });
            },
            searchQuery: function (value) {
                var queryObjects = [];
                queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().INT, value));
                queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                paginationService.setTextSearch(queryObjects);
                paginationService.getQuery(ATTACHED_VOLUMES_PATH, objectTransformService.transformVolume).then(function (result) {
                    updateResultTotalCounts(result);
                });
            }
        };

    });
