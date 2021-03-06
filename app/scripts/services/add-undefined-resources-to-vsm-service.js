/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc service
 * @name rainierApp.createVsmService
 * @description
 * # createVsmService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('addUndefinedResourcesService', function ($modal,
                                                       synchronousTranslateService,
                                                       constantService,
                                                       $timeout,
                                                       orchestratorService) {


        /**
         * 0. Common
         */
        var openErrorDialog = function (message) {
            var modalInstance = $modal.open({
                templateUrl: 'views/templates/error-modal.html',
                windowClass: 'modal fade confirmation',
                backdropClass: 'modal-backdrop',
                controller: function ($scope) {
                    $scope.error = {
                        title: synchronousTranslateService.translate('error-message-title'),
                        message: message
                    };
                    $scope.cancel = function () {
                        modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    };

                    modalInstance.result.finally(function () {
                        modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    });
                }
            });
        };
        /**
         * 1. Add Physical Storage Systems
         */
        var setupStorageModel = function (dataModel, result, virtualStorageMachineId, virtualStorageSystemModel) {
            var storageModel = {
                view: 'tile',
                hasFileUsageBar: false,
                displayList: result,
                subTitle: 'Select the Storage System',
                virtualStorageSystemId: virtualStorageMachineId,
                virtualStorageSystemModel: virtualStorageSystemModel,
                search: {
                    freeText: '',
                    freeCapacity: constantService.CAPACITY_FILTER_DEFAULT_CONDITION(),
                    totalCapacity: constantService.CAPACITY_FILTER_DEFAULT_CONDITION(),
                },
                sort: {
                    field: 'storageSystemId',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if (dataModel.sort.field === f) {
                                dataModel.sort.reverse = !dataModel.sort.reverse;
                            } else {
                                dataModel.sort.field = f;
                                dataModel.sort.reverse = false;
                            }
                        });
                    }
                }
            };
            return storageModel;
        };

        var addPhysicalStorageSystemsToSelected = function (dataModel) {
            dataModel.selected.displayList = dataModel.displayList;
            dataModel.selected.storageSystems = _.filter(dataModel.displayList, function(item){
                return item.selected === true;
            });
            dataModel.selected.storageSystem = dataModel.selected.storageSystems[0];
        };
        /**
         * 2. Add Volumes to VSM
         */
        var setupVolumeModel = function (dataModel) {
            var volumeModel = {
                subTitle: 'Add Volumes From Each Storage System',
                volumes: dataModel.selected.addVolumesToVsm,
                add: function () {
                    var storageSystemId = dataModel.getSelectedItems()[0].storageSystemId;
                    var numberOfVolumes = dataModel.numberOfVolumes;
                    dataModel.volumes.push({
                        storageSystemId: storageSystemId,
                        numberOfVolumes: numberOfVolumes
                    });
                },
                remove: function (index) {
                    dataModel.volumes.splice(index, 1);
                },
                setStorageSystems: function (ss) {
                    dataModel.selected.storageSystem = ss;
                }
            };
            return volumeModel;
        };

        var addVolumesToSelected = function (dataModel) {
            dataModel.selected.addVolumesToVsm = dataModel.volumes;
            dataModel.selected.storageSystem = dataModel.selected.storageSystems[0];

            _.each(dataModel.numberOfVolumes, function (val, i) {
                var element = {
                    storageSystemId: dataModel.storageSystemId[i].storageSystemId,
                    numberOfVolumes: val
                };
                dataModel.selected.addVolumesToVsm.push(element);
            });
        };

        var getPhysicalStorageSystemSummary = function (virtualStorageMachineId, physicalStorageSystemId) {
            return orchestratorService.physicalStorageSystemSummaryInVsm(virtualStorageMachineId,
                physicalStorageSystemId).then(function(result){
                var summaryModel = {
                    volume : {
                        defined: result.definedVolumeCount,
                        undefined: result.undefinedVolumeCount
                    },
                    hostGroups : {}
                };

                _.each(result.hostGroups, function(h){
                    var item = {
                        defined: h.definedCount,
                        undefined: h.undefinedCount,
                    };
                    summaryModel.hostGroups[h.storagePortId] = item;
                });

                summaryModel.virtualStorageMachineId = virtualStorageMachineId;
                summaryModel.physicalStorageSystemId = physicalStorageSystemId;

                summaryModel.title = '';

                return summaryModel;
            }).catch(function () {
                return {
                    volume : {
                        defined: 0,
                        undefined: 0
                    },
                    hostGroups : {}
                };
            });
        };

        /**
         * 3. Add Host Groups to VSM
         */
        var setupHostGroupModel = function (dataModel) {
            var hostGroupModel = {
                subTitle: 'Add Host Group From Each Storage System',
                hostGroups: [],
                add: function () {
                    var storageSystemId = dataModel.getSelectedItems()[0].storageSystemId;
                    var storagePortId = dataModel.getPorts[0].storagePortId;
                    var numberOfHostGroups = dataModel.numberOfHostGroups;
                    dataModel.hostGroups.push({
                        storageSystemId: storageSystemId,
                        storagePortId: storagePortId,
                        numberOfHostGroups: numberOfHostGroups
                    });
                },
                remove: function (index) {
                    dataModel.hostGroups.splice(index, 1);
                },
                setStorageSystems: function (ss) {
                    orchestratorService.storagePorts(ss.storageSystemId).then(function (result) {
                        dataModel.getPorts = result.resources;
                        dataModel.selected.port = dataModel.getPorts[0];
                    });

                    dataModel.selected.storageSystem = ss;

                },
                setStoragePort: function (sp) {
                    dataModel.selected.port = sp;
                }
            };
            return hostGroupModel;
        };

        var addHostGroupsToSelected = function (dataModel) {
            dataModel.selected.addHostGroupsToVsm = dataModel.hostGroups;
        };

        var createPayload = function (dataModel) {
            var physicalStorageSystems = [];
            dataModel.selected.addVolumesToVsm.forEach(function (vol) {
                var hgs = _.filter(dataModel.selected.addHostGroupsToVsm, function (hg) {
                    return hg.storageSystemId === vol.storageSystemId;
                });

                var hostGroups = [];

                hgs.forEach(function (hg) {
                    hostGroups.push({
                        portId: hg.storagePortId,
                        number: hg.numberOfHostGroups
                    });
                });

                physicalStorageSystems.push({
                    storageSystemId: vol.storageSystemId,
                    numberOfVolumes: vol.numberOfVolumes,
                    hostGroups: hostGroups
                });
            });
            var payload = {
                physicalStorageSystems: physicalStorageSystems
            };
            return payload;
        };

        return {
            /**
             * 0. Common
             */
            openErrorDialog: openErrorDialog,
            getPhysicalStorageSystemSummary: getPhysicalStorageSystemSummary,
            /**
             * 1. Add Physical Storage Systems
             */
            setupStorageModel: setupStorageModel,
            addPhysicalStorageSystemsToSelected: addPhysicalStorageSystemsToSelected,
            /**
             * 2. Add Volumes to VSM
             */
            setupVolumeModel: setupVolumeModel,
            addVolumesToSelected: addVolumesToSelected,
            /**
             * 3. Add Host Groups to VSM
             */
            setupHostGroupModel: setupHostGroupModel,
            addHostGroupsToSelected: addHostGroupsToSelected,
            createPayload: createPayload
        };

    });