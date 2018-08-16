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
    .factory('createVsmService', function ($modal,
                                           synchronousTranslateService,
                                           orchestratorService,
                                           constantService,
                                           $timeout,
                                           $q) {
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

        var RAID500_600_700 = {min: 1, max: 99999};
            var HM700 = {min: 200001, max: 299999};
            var RAID800_850 = {min: 300001, max: 399999};
            var HM800_850 = {min: 400001, max: 499999};

        var vsmModelRange = {
            VSP_F900: HM800_850,
            VSP_G900: HM800_850,
            VSP_F700: HM800_850,
            VSP_G700: HM800_850,
            VSP_F370: HM800_850,
            VSP_G370: HM800_850,
            VSP_F350: HM800_850,
            VSP_G350: HM800_850,
            VSP_F800_AND_VSP_G800: HM800_850,
            VSP_F400_F600_AND_VSP_G400_G600: HM800_850,
            VSP_G200: HM800_850,
            HUS_VM: HM700,
            VSP_F1500_AND_VSP_G1000_G1500: HM800_850,
            VSP: RAID500_600_700,
            USP_VM: RAID500_600_700,
            USP_V: RAID500_600_700,
            NSC: RAID500_600_700,
            USP: RAID500_600_700
        };


        var checkVirtualSerialNumber = function (selectedStorageSystemIds, specifiedSerialNumber) {
            if(_.contains(selectedStorageSystemIds, specifiedSerialNumber)) {
                return $q.reject(synchronousTranslateService.translate('same-serial-number-error-message'));
            }
            return $q.resolve(true);
        };

        var setupStorageModel = function (dataModel, result) {
            var storageModel = {
                sameModelSelection: false,
                serialNumber: undefined,
                selectedVirtualModel: undefined,
                view: 'tile',
                hasFileUsageBar: false,
                displayList: result,
                virtualModel: {},
                subTitle: 'Select the Storage System',
                search: {
                    freeText: '',
                    freeCapacity: constantService.CAPACITY_FILTER_DEFAULT_CONDITION(),
                    totalCapacity: constantService.CAPACITY_FILTER_DEFAULT_CONDITION(),
                    hasMigrationTasks: null
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
                },
                updateSelectedVirtualModel: function () {
                    if (!_.isUndefined (dataModel.selectedVirtualModel)) {
                        var key = dataModel.selectedVirtualModel;
                        var range = vsmModelRange[key];
                        dataModel.placeholder = range.min + ' to ' + range.max;
                    }
                },
                updateSelectedStorageSystem: function () {
                    if (!_.isUndefined (dataModel.useExistingStorage)) {
                        var useExistingStorage = dataModel.useExistingStorage;
                        dataModel.serialNumber = useExistingStorage.storageSystemId;
                        dataModel.selectedVirtualModel = useExistingStorage.model;
                    }
                }
            };
            return storageModel;
        };

        var storageFooterCanGoNext = function (dataModel) {
            var virtualSerialNumberCheck = _.isUndefined (dataModel.validationForm.$error.number) ?
                true : !dataModel.validationForm.$error.number;
            return(
                !_.isUndefined(dataModel.serialNumber) &&
                !_.isUndefined(dataModel.selectedVirtualModel) &&
                dataModel.getSelectedItems().length > 0 &&
                virtualSerialNumberCheck);
        };

        /**
         * 2. Add Volumes to VSM
         */
        var volumeFooterCanGoNext = function (dataModel) {
            return dataModel.numberOfVolumes.length ===  dataModel.selectedItems.length &&
                !_.contains(dataModel.numberOfVolumes, null) &&
                _.every(dataModel.numberOfVolumes, function (num) {
                    return num >= 0 && num <=65000;
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
                    var getSelectedItems = dataModel.getSelectedItems();
                    var index = _.indexOf(getSelectedItems, ss);
                    var selectedStorageSystem = getSelectedItems[index];
                    getSelectedItems.splice(index, 1);
                    getSelectedItems.unshift(selectedStorageSystem);
                    dataModel.getSelectedItems = function () {
                        return getSelectedItems;
                    };
                    orchestratorService.storagePorts(ss.storageSystemId).then(function (result) {
                        dataModel.getPorts = result.resources;
                    });
                },
                setStoragePort: function (sp) {
                    var getPorts = dataModel.getPorts;
                    var index = _.indexOf(getPorts, sp);
                    var selectedPort = getPorts[index];
                    getPorts.splice(index, 1);
                    getPorts.unshift(selectedPort);
                    dataModel.getPorts = getPorts;
                }
            };
            return hostGroupModel;
        };

        var createPayload = function (selected) {
            var physicalStorageSystems = [];
            selected.addVolumesToVsm.forEach(function (vol) {
                var hgs = _.filter(selected.addHostGroupsToVsm, function (hg) {
                    return hg.storageSystemId === vol.storageSystemIds;
                });

                var hostGroups = [];

                hgs.forEach(function (hg) {
                    hostGroups.push({
                        portId: hg.storagePortId,
                        number: hg.numberOfHostGroups
                    });
                });

                physicalStorageSystems.push({
                    storageSystemId: vol.storageSystemIds,
                    numberOfVolumes: vol.numberOfVolumes,
                    hostGroups: hostGroups
                });
            });
            var payload = {
                storageSystemId: selected.serialNumber,
                model: selected.selectedVirtualModel,
                physicalStorageSystems: physicalStorageSystems
            };
            return payload;
        };


        return {
            /**
             * 0. Common
             */
            openErrorDialog: openErrorDialog,
            /**
             * 1. Add Physical Storage Systems
             */
            vsmModelRange: vsmModelRange,
            checkVirtualSerialNumber: checkVirtualSerialNumber,
            setupStorageModel: setupStorageModel,
            storageFooterCanGoNext: storageFooterCanGoNext,
            /**
             * 2. Add Volumes to VSM
             */
            volumeFooterCanGoNext: volumeFooterCanGoNext,
            /**
             * 3. Add Host Groups to VSM
             */
            setupHostGroupModel: setupHostGroupModel,
            createPayload: createPayload

        };
    });
