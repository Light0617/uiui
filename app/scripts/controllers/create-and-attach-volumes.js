/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2015. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:CreateAndAttachVolumesCtrl
 * @description
 * # CreateAndAttachVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('CreateAndAttachVolumesCtrl', function($scope, orchestratorService, viewModelService, ShareDataService,
                                                       paginationService, queryService, objectTransformService,
                                                       cronStringConverterService, attachVolumeService, replicationService,
                                                       volumeService, constantService, $location, $timeout) {

        var selectedServers = ShareDataService.pop('selectedServers');
        var getPortsPath = 'storage-ports';
        if (!selectedServers || selectedServers.length === 0) {
            $location.path('hosts');
        }

        paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result) {
            var dataModel = viewModelService.newWizardViewModel(['create', 'attach', 'paths', 'protect']);
            dataModel.storageSystems = [];
            _.forEach(result, function (storageSystem) {
                if (storageSystem.accessible) {
                    dataModel.storageSystems.push(storageSystem);
                }
            });
            dataModel.selectedStorageSystem = dataModel.storageSystems[0];
            dataModel.copyGroupNameRegexp = /^[a-zA-Z0-9_][a-zA-Z0-9-_]*$/;
            dataModel.decimalNumberRegexp = /^[^.]+$/;
            dataModel.validLabel = function(volumeGroup){
                volumeGroup.labelIsValid = volumeService.validateCombinedLabel(volumeGroup.label, volumeGroup.suffix, volumeGroup.noOfVolumes);

            };
            dataModel.storagePorts = [];
            dataModel.process = function(resources){
                // Only support for fibre port for now
                resources = _.filter(resources, function(storagePort) {
                    return storagePort.type === 'FIBRE';
                });
                _.forEach(resources, function (item) {
                    item.storageSystemModel = dataModel.storageSystemModel;
                    objectTransformService.transformPort(item);
                });

                dataModel.storagePorts = resources;
            };
            dataModel.canSubmit = true;
            $scope.dataModel = dataModel;
        });

        var handleSelectedStorageSystemChange = function(selectedStorageSystem) {
            if (!selectedStorageSystem) {
                return;
            }

            buildSummaryModel(selectedStorageSystem);

            paginationService.getAllPromises(null, 'storage-pools', true, selectedStorageSystem.storageSystemId,
                objectTransformService.transformPool).then(function (result) {
                $scope.dataModel.storagePools = result;
            });

            orchestratorService.storageSystem(selectedStorageSystem.storageSystemId).then(function(result) {
                $scope.dataModel.storageSystemModel = result.model;
                paginationService.getAll(null, getPortsPath, true, selectedStorageSystem.storageSystemId, result.model, $scope.dataModel);
            });

            paginationService.getAllPromises(null, 'replication-groups', true, selectedStorageSystem.storageSystemId,
                objectTransformService.transformReplicationGroup).then(function (result) {
                    $scope.dataModel.copyGroups = result;
                });
        };

        var buildSummaryModel = function(selectedStorageSystem) {
            $scope.dataModel.summaryModel = viewModelService.buildSummaryModel(selectedStorageSystem);
        };

        $scope.$watch('dataModel.selectedStorageSystem', function(selected) {
            handleSelectedStorageSystemChange(selected);
        });

        $scope.$watch('dataModel.storagePools', function(pools) {
            if (!pools) {
                return;
            }
            $scope.dataModel.createModel = {
                storageSystemSelectable: true,
                volumesGroupsModel: viewModelService.newCreateVolumeModel(pools, true)
            };

        });

        var autoSelect = 'AUTO';

        $scope.$watch('dataModel.storagePorts', function(ports) {
            if (!ports) {
                return;
            }

            var hostModes = constantService.osType().sort();
            hostModes.splice(0, 0, autoSelect);
            orchestratorService.storageSystemHostModeOptions($scope.dataModel.selectedStorageSystem.storageSystemId).then(function (results) {
                var wwpns = attachVolumeService.getSelectedServerWwpns(selectedServers);
                var queryString = paginationService.getQueryStringForList(wwpns);
                paginationService.clearQuery();
                queryService.setQueryMapEntry('hbaWwns', queryString);
                paginationService.getAllPromises(null, 'host-groups', false, $scope.dataModel.selectedStorageSystem.storageSystemId, null, false).then(function(hostGroupResults) {
                    var hostModeOption = attachVolumeService.getMatchedHostModeOption(hostGroupResults);
                    var attachModel = {
                        lastSelectedHostModeOption: hostModeOption,
                        storageSystemSelectable: false,
                        enableZoning: false,
                        enableLunUnification: false,
                        storagePorts: ports,
                        selectedServers: selectedServers,
                        selectedHostModeOption: hostModeOption,
                        hostModes: hostModes,
                        hostMode: attachVolumeService.getMatchedHostMode(hostGroupResults, hostModes[0]),
                        hostModeOptions: results,
                        serverPortMapperModel: viewModelService.newServerPortMapperModel(ports, selectedServers),
                        previous: function() {
                            $scope.dataModel.goBack();
                        },
                        canGoNext: function () {
                            return true;
                        },
                        next: function() {
                            var filteredHostGroups = attachVolumeService.getAllocateLikeFilteredHostGroups(
                                selectedServers,
                                hostGroupResults,
                                $scope.dataModel.attachModel.hostMode,
                                $scope.dataModel.attachModel.selectedHostModeOption);

                            attachVolumeService.setEditLunPage($scope.dataModel,
                                $scope.dataModel.selectedStorageSystem.storageSystemId,
                                attachModel.selectedVolumes,
                                selectedServers,
                                attachVolumeService.getSelectedHostMode($scope.dataModel),
                                attachModel.storagePorts,
                                filteredHostGroups,
                                true
                            );

                            angular.extend($scope.dataModel.protectModel,
                                {
                                    selectedVolumes: attachModel.selectedVolumes
                                });

                            $scope.dataModel.goNext();
                        }
                    };
                    $scope.dataModel.attachModel = attachModel;

                }).finally(function(){
                    paginationService.clearQuery();
                });

            });

            $scope.dataModel.checkSelectedHostModeOptions = function() {
                attachVolumeService.checkSelectedHostModeOptions($scope.dataModel);
            };
        });

        var subscriptionUpdateModel = viewModelService.newSubscriptionUpdateModel();

        $scope.$watch('dataModel.createModel.volumesGroupsModel.volumes', function(volumeGroups) {

            var arrayCopy = subscriptionUpdateModel.getUpdatedModel($scope.dataModel.selectedStorageSystem, volumeGroups);
            if (arrayCopy) {
                $timeout(function() {
                    buildSummaryModel(arrayCopy);
                });
            }
        }, true);

        $scope.$watch('dataModel.copyGroups', function(copyGroups) {
            if (!copyGroups) {
                return;
            }

            var protectModel = {
                $replicationRawTypes: replicationService.rawTypes,
                replicationTechnology: replicationService.rawTypes.SNAP,
                noOfSnapshots: null,
                noOfCopies: 0,
                consistencyGroup: false,
                storageSystemSelectable: false,
                copyGroupName: '',
                schedule: viewModelService.newScheduleModel(),

                submit: function() {
                    $scope.dataModel.goNext();

                    var model = $scope.dataModel;

                    var volumePayloads = model.createModel.volumesGroupsModel.mapToPayloads(model.protectModel.selectedVolumes);
                    var skipProtection = model.protectModel.replicationTechnology === 'NONE';

                    var replicationPayload = null;
                    if (!skipProtection) {
                        replicationPayload = model.protectModel.getReplicationPayload();
                    }
                    var payload = $scope.dataModel.pathModel.attachVolumesToServersPayload;

                    angular.extend(payload,
                        {
                            volumes: volumePayloads,
                            skipProtection : skipProtection,
                            replicationGroup :replicationPayload
                        }
                    );

                    orchestratorService.createAttachProtectVolumes(payload).then(function() {
                        window.history.back();
                    });
                },
                previous: function() {
                    $scope.dataModel.goBack();
                }

            };

            protectModel.isEnableSnapshot = function() {
                return replicationService.isSnap(protectModel.replicationTechnology);
            };

            protectModel.canSubmit = function() {
                protectModel.replicationModel = {};
                if (protectModel.replicationTechnology === 'NONE') {
                    return true;
                }
                if (protectModel.copyGroup.useNew) {
                    if (_.isEmpty(protectModel.copyGroupName) || !_.isFinite(protectModel.noOfSnapshots)) {
                        return false;
                    } else {
                        protectModel.replicationModel.replicationGroupName = protectModel.copyGroupName;
                    }
                } else {
                    protectModel.replicationModel.replicationGroupId = protectModel.copyGroup.id;
                }

                if (replicationService.isSnap(protectModel.replicationTechnology)) {
                    return protectModel.schedule.isValid();
                } else if (replicationService.isClone(protectModel.replicationTechnology)) {
                    return _.isFinite(protectModel.noOfSnapshots);
                } else {
                    return true;
                }
            };

            protectModel.getReplicationPayload = function() {

                var payload;

                if (protectModel.copyGroup.useNew) {
                    payload = {
                        replicationType: protectModel.replicationTechnology,
                        consistencyGroupNeeded: protectModel.consistencyGroup,
                        replicationGroupName : protectModel.copyGroupName,
                        replicationGroupId : null,
                        schedule : null,
                        numberOfBackups : null
                    };
                    payload.replicationGroupName = protectModel.copyGroupName;
                    if (replicationService.isSnap(protectModel.replicationTechnology)) {
                        payload.numberOfBackups = protectModel.noOfSnapshots;
                        payload.schedule = cronStringConverterService.fromDatePickerToObjectModel(
                            $scope.dataModel.protectModel.schedule.type, $scope.dataModel.protectModel.schedule.time,
                            $scope.dataModel.protectModel.schedule.dayOfMonth, $scope.dataModel.protectModel.schedule.selectedDays,
                            $scope.dataModel.protectModel.schedule.hourInterval, $scope.dataModel.protectModel.schedule.hourStartMinute);
                    } else if (replicationService.isClone(protectModel.replicationTechnology)) {
                        payload.numberOfBackups = protectModel.noOfCopies;
                    }
                } else {
                    payload = {
                        replicationGroupId : protectModel.copyGroup.id
                    };
                }
                return payload;
            };

            $scope.dataModel.protectModel = protectModel;
            filterCopyGroups($scope.dataModel.protectModel.replicationTechnology);

        });

        function setDropDownVisibility(){
            $scope.dataModel.showDropDownColumn = true;
        }

        $scope.$watchGroup(['dataModel.currentPage', 'dataModel.protectModel.replicationTechnology', 'dataModel.protectModel.noOfSnapshots', 'dataModel.protectModel.noOfCopies', 'dataModel.protectModel.consistencyGroup', 'dataModel.protectModel.schedule.toScheduleString()'], function (values) {
            if (values[0] !== 'protect') {
                return;
            }
            var replicationType = values[1];
            if (!replicationType) {
                return;
            }

            filterCopyGroups(replicationType);

        });

        function filterCopyGroups(replicationType) {
            $scope.dataModel.showDropDownColumn = false;

            $timeout(setDropDownVisibility, 100);

            var validCopyGroups = [{
                useNew: true,
                name: 'Use New'
            }];

            var noOfCopiesInput;
            var currentSchedule = cronStringConverterService.fromDatePickerToObjectModel($scope.dataModel.protectModel.schedule.type,
                $scope.dataModel.protectModel.schedule.time, $scope.dataModel.protectModel.schedule.dayOfMonth,
                $scope.dataModel.protectModel.schedule.selectedDays, $scope.dataModel.protectModel.schedule.hourInterval,
                $scope.dataModel.protectModel.schedule.hourStartMinute);

            if(replicationService.isSnap(replicationType)){
                noOfCopiesInput = parseInt($scope.dataModel.protectModel.noOfSnapshots);
                _.forEach($scope.dataModel.copyGroups, function (cg) {
                    var cgConsistent = cg.consistent === 'On';
                    if (replicationService.isSnap(cg.type) &&
                        (!_.isFinite(noOfCopiesInput) || noOfCopiesInput === 0 || noOfCopiesInput === cg.numberOfCopies) &&
                        (cronStringConverterService.isEqualForObjectModel(currentSchedule, cg.schedule)) &&
                        ($scope.dataModel.protectModel.consistencyGroup === cgConsistent)) {
                        validCopyGroups.push(cg);
                    }
                });
            } else if (replicationService.isClone(replicationType)) {
                noOfCopiesInput = $scope.dataModel.protectModel.noOfCopies;
            } else {
                noOfCopiesInput = null;
            }

            $scope.dataModel.protectModel.copyGroup = validCopyGroups[0];
            $scope.dataModel.protectModel.validCopyGroups = validCopyGroups;
        }

        $scope.$watch('dataModel.protectModel.schedule.hourStartMinute', function(value) {
            $scope.dataModel.protectModel.minuteDisplay = cronStringConverterService.addSuffix(value);
        });

        $scope.$watchGroup(['dataModel.createModel', 'dataModel.attachModel'], function(vals) {
            if (_.some(vals, function(v) {
                    return !v;
                })) {
                return;
            }

            var createModel = vals[0];
            var attachModel = vals[1];
            var volumesGroupsModel = createModel.volumesGroupsModel;
            if (!volumesGroupsModel || !volumesGroupsModel.getVolumeGroups) {
                return;
            }
            createModel.next = function() {

                var selectedVolumes = volumesGroupsModel.getVolumeGroups();
                attachModel.selectedVolumes = selectedVolumes;
                $scope.dataModel.goNext();
            };
            createModel.canGoNext = function() {
                return volumesGroupsModel.isValid();
            };
        });

    });
