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
                                                       paginationService, objectTransformService,
                                                       cronStringConverterService,
                                                       volumeService, $location, $timeout) {

        var selectedServers = ShareDataService.pop('selectedServers');
        var getPortsPath = 'storage-ports';
        if (!selectedServers || selectedServers.length === 0) {
            $location.path('hosts');
        }

        paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result) {
            var dataModel = viewModelService.newWizardViewModel(['create', 'attach', 'protect']);
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

                dataModel.storagePorts = dataModel.storagePorts.concat(resources);
            };
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
                volumesGroupsModel: viewModelService.newCreateVolumeModel(pools)
            };

        });

        var autoSelect = 'AUTO';
        var lastSelectedHostModeOption = [0];

        $scope.$watch('dataModel.storagePorts', function(ports) {
            if (!ports) {
                return;
            }

            var hostModeOptions = orchestratorService.hostModeOptions();
            var hostModes = orchestratorService.osType().sort();
            hostModes.splice(0, 0, autoSelect);
            var attachModel = {
                storageSystemSelectable: false,
                enableZoning: false,
                enableLunUnification: false,
                storagePools: ports,
                selectedServers: selectedServers,
                selectedHostModeOption: lastSelectedHostModeOption,
                hostModes: hostModes,
                hostMode: hostModes[0],
                hostModeOptions: hostModeOptions,
                serverPortMapperModel: viewModelService.newServerPortMapperModel(ports, selectedServers),
                previous: function() {
                    $scope.dataModel.goBack();
                }

            };
            $scope.dataModel.attachModel = attachModel;

            $scope.dataModel.checkSelectedHostModeOptions = function() {
                var selectedHostModeOptions = $scope.dataModel.attachModel.selectedHostModeOption;
                var recentlySelected = difference(lastSelectedHostModeOption, selectedHostModeOptions);
                if (selectedHostModeOptions.length === 0 || recentlySelected === 0) {
                    updateHostModeOptions([0]);
                } else {
                    updateHostModeOptions(_.without(selectedHostModeOptions, 0));
                }
            };
        });

        function difference(array1, array2) {
            if (array1.length > array2) {
                return _.difference(array1, array2)[0];
            } else {
                return _.difference(array2, array1)[0];
            }
        }

        function updateHostModeOptions(hostModeOptions) {
            $scope.dataModel.attachModel.selectedHostModeOption = hostModeOptions;
            lastSelectedHostModeOption = $scope.dataModel.attachModel.selectedHostModeOption;
        }

        var subscriptionUpdateModel = viewModelService.newSubscriptionUpdateModel();

        $scope.$watchGroup(['dataModel.selectedStorageSystem', 'dataModel.createModel.volumesGroupsModel.volumes'], function(vals) {

            if (_.some(vals, function(v) {
                    return !v;
                })) {
                return;
            }
            var storageSystem = vals[0];
            var volumeGroups = vals[1];

            var arrayCopy = subscriptionUpdateModel.getUpdatedModel(storageSystem, volumeGroups);
            if (!arrayCopy) {
                return;
            }
            $timeout(function() {
                buildSummaryModel(arrayCopy);
            });


        }, true);

        $scope.$watch('dataModel.copyGroups', function(copyGroups) {
            if (!copyGroups) {
                return;
            }


            var protectModel = {
                replicationTechnology: 'SNAPSHOT',
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
                    var selectedHostModeOptions = _.where(model.attachModel.selectedHostModeOption, function (mode){
                        return mode > 0;
                    });
                    var payload = {
                        storageSystemId: model.selectedStorageSystem.storageSystemId,
                        hostModeOptions: selectedHostModeOptions,
                        ports: model.attachModel.serverPortMapperModel.getPorts(),
                        enableZoning: model.attachModel.enableZoning,
                        enableLunUnification: model.attachModel.enableLunUnification,
                        volumes: volumePayloads,
                        skipProtection : skipProtection,
                        replicationGroup :replicationPayload
                    };
                    if (model.attachModel.hostMode !== autoSelect) {
                        payload.intendedImageType = model.attachModel.hostMode;
                    }
                    orchestratorService.createAttachProtectVolumes(payload).then(function() {
                        window.history.back();
                    });
                },
                previous: function() {
                    $scope.dataModel.goBack();
                }

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

                switch (protectModel.replicationTechnology) {
                    case 'SNAPSHOT':
                        return protectModel.schedule.isValid();
                    case 'CLONE':
                        return _.isFinite(protectModel.noOfSnapshots);
                }
                return true;
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
                    switch (protectModel.replicationTechnology) {
                        case 'SNAPSHOT':
                            payload.numberOfBackups = protectModel.noOfSnapshots;
                            payload.schedule = cronStringConverterService.fromDatePickerToObjectModel(
                            $scope.dataModel.protectModel.schedule.type, $scope.dataModel.protectModel.schedule.time,
                            $scope.dataModel.protectModel.schedule.dayOfMonth, $scope.dataModel.protectModel.schedule.selectedDays,
                            $scope.dataModel.protectModel.schedule.hourInterval, $scope.dataModel.protectModel.schedule.hourStartMinute);
                            break;
                        case 'CLONE':
                            payload.numberOfBackups = protectModel.noOfCopies;
                            break;
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

            if(replicationType === 'SNAPSHOT'){
                noOfCopiesInput = parseInt($scope.dataModel.protectModel.noOfSnapshots);
                _.forEach($scope.dataModel.copyGroups, function (cg) {
                    var cgConsistent = cg.consistent === 'On';
                    if (replicationType === 'SNAPSHOT') {
                        if (('Snapshot' === cg.type) &&
                            (!_.isFinite(noOfCopiesInput) || noOfCopiesInput === 0 || noOfCopiesInput === cg.numberOfCopies) &&
                            (cronStringConverterService.isEqualForObjectModel(currentSchedule, cg.schedule)) &&
                            ($scope.dataModel.protectModel.consistencyGroup === cgConsistent)) {
                            validCopyGroups.push(cg);
                        }
                    }
                });
            } else if (replicationType === 'CLONE') {
                noOfCopiesInput = $scope.dataModel.protectModel.noOfCopies;
            } else {
                noOfCopiesInput = null;
            }

            $scope.dataModel.protectModel.copyGroup = validCopyGroups[0];
            $scope.dataModel.protectModel.validCopyGroups = validCopyGroups;
        }

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

        $scope.$watchGroup(['dataModel.attachModel', 'dataModel.protectModel'], function(vals) {
            if (_.some(vals, function(v) {
                    return !v;
                })) {
                return;
            }

            var protectModel = vals[1];
            var attachModel = vals[0];
            attachModel.next = function() {

                protectModel.selectedVolumes = attachModel.selectedVolumes;
                $scope.dataModel.goNext();
            };
        });

    });
