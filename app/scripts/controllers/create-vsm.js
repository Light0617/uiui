/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:CreateVsmCtrl
 * @description
 * # CreateVsmCtrl
 * Controller of the rainierApp
 */

angular.module('rainierApp')
    .controller('CreateVsmCtrl', function ($scope,
                                           $timeout,
                                           orchestratorService,
                                           objectTransformService,
                                           synchronousTranslateService,
                                           scrollDataSourceBuilderServiceNew,
                                           $location,
                                           diskSizeService,
                                           paginationService,
                                           constantService,
                                           viewModelService,
                                           $q,
                                           $modal,
                                           createVsmService) {

        /**
         * 0. Initial process for all pages
         */
        var initCommon = function () {
            $scope.dataModel = viewModelService.newWizardViewModel(['addPhysicalStorageSystems',
                                                                    'addVolumesToVsm',
                                                                    'addHostGroupsToVsm']);
            $scope.selected = {
                sameModelSelection: false,
                serialNumber: undefined,
                selectedVirtualModel: undefined,
                useExistingStorage: undefined,
                addVolumesToVsm: [],
                addHostGroupsToVsm: []
            };

            initAddPhysicalStorageSystemView();
        };

        /**
         * 1. Add Physical Storage Systems
         */
        var initAddPhysicalStorageSystemView = function () {
            var GET_STORAGE_SYSTEM_PATH = 'storage-systems';

            paginationService.getAllPromises(null,
                                             GET_STORAGE_SYSTEM_PATH,
                                             true,
                                             null,
                                             objectTransformService.transformStorageSystem).then(function (result) {

                var storageSystems = result;
                var hasFileUsageBar = false;

                var dataModel = {
                    validationForm: {
                        serialNumber: ''
                    },
                    sameModelSelection: false,
                    serialNumber: undefined,
                    selectedVirtualModel: undefined,
                    view: 'tile',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
                    hasFileUsageBar: hasFileUsageBar,
                    displayList: result,
                    virtualModel: {},
                    subTitle: 'Add Volume Ids From Each Storage Systems',
                    search: {
                        freeText: '',
                        freeCapacity: {
                            min: 0,
                            max: 1000,
                            unit: 'PB'
                        },
                        totalCapacity: {
                            min: 0,
                            max: 1000,
                            unit: 'PB'
                        }
                    },
                    sort: {
                        field: 'storageSystemId',
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
                    updateSelectedVirtualModel: function () {
                        if (!_.isUndefined ($scope.dataModel.selectedVirtualModel)) {
                            var key = $scope.dataModel.selectedVirtualModel;
                            var range = createVsmService.vsmModelRange[key];
                            $scope.dataModel.placeholder = range.min + ' to ' + range.max;
                        }
                    },
                    updateSelectedStorageSystem: function () {
                        if (!_.isUndefined ($scope.dataModel.useExistingStorage)) {
                            var useExistingStorage = $scope.dataModel.useExistingStorage;
                            $scope.dataModel.serialNumber = useExistingStorage.storageSystemId;
                            $scope.dataModel.selectedVirtualModel = useExistingStorage.model;
                        }
                    }
                };

                $scope.dataModel.VirtualModelCandidates = constantService.virtualModelOptions();

                _.extend($scope.dataModel, dataModel);

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, storageSystems, 'storageSystemSearch');

                var updateResultTotalCounts = function (result) {
                    $scope.dataModel.nextToken = result.nextToken;
                    $scope.dataModel.cachedList = result.resources;
                    $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                    $scope.dataModel.itemCounts = {
                        filtered: $scope.dataModel.displayList.length,
                        total: $scope.dataModel.total
                    };
                };

                var addPhysicalStorageSystemsToSelected = function () {
                    $scope.selected.sameModelSelection = $scope.dataModel.sameModelSelection;
                    $scope.selected.selectedVirtualModel = $scope.dataModel.selectedVirtualModel;
                    $scope.selected.serialNumber = $scope.dataModel.serialNumber;
                };

                var storageFooter = function (dataModel) {
                    return {
                        canGoNext: function () {
                            var virtualSerialNumberCheck = _.isUndefined (dataModel.validationForm.$error.number) ?
                                true : !dataModel.validationForm.$error.number;
                            return (
                                !_.isUndefined(dataModel.serialNumber) &&
                                !_.isUndefined(dataModel.selectedVirtualModel) &&
                                dataModel.getSelectedItems().length > 0) &&
                                virtualSerialNumberCheck;
                        },
                        next: function () {
                            addPhysicalStorageSystemsToSelected();
                            if(!dataModel.sameModelSelection) {
                                createVsmService.checkVirtualSerialNumber(
                                    _.map(dataModel.getSelectedItems(), function (selected) {
                                        return selected.storageSystemId;
                                    }), dataModel.serialNumber)
                                    .then(initAddVolumesToVsm())
                                    .then(dataModel.goNext)
                                    .catch(createVsmService.openErrorDialog);
                            }
                            else {
                                dataModel.goNext();
                                initAddVolumesToVsm();
                            }
                        }
                    };
                };

                $scope.footModel = storageFooter($scope.dataModel);
            });

        };

        /**
         * 2. Add Volumes to VSM
         */
        var initAddVolumesToVsm = function () {
            var volumeModel = {
                selectedItems: $scope.dataModel.getSelectedItems(),
                storageSystemId: $scope.dataModel.getSelectedItems(),
                numberOfVolumes: []
            };

            _.extend($scope.dataModel, volumeModel);

            var addVolumesToSelected = function () {
                _.each(volumeModel.numberOfVolumes, function (val, i) {
                    var element = {
                        storageSystemIds: volumeModel.storageSystemId[i].storageSystemId,
                        numberOfVolumes: val
                    };
                    $scope.selected.addVolumesToVsm.push(element);
                });
            };

            var setupGetPorts = function () {
                return orchestratorService.storagePorts($scope.dataModel.getSelectedItems()[0].storageSystemId)
                    .then(function (result) {
                        $scope.dataModel.getPorts = result.resources;
                    });
            };

            var volumeFooter = function (dataModel) {
                return {
                    canGoNext: function () {
                        return volumeModel.numberOfVolumes.length ===  volumeModel.selectedItems.length &&
                            !_.contains(volumeModel.numberOfVolumes, null);
                    },
                    next: function () {
                        addVolumesToSelected();
                        setupGetPorts();
                        initAddHostGroupToVsm();
                        dataModel.goNext();
                    },
                    previous: function () {
                        initAddPhysicalStorageSystemView();
                        dataModel.goBack();
                    }
                };
            };

            $scope.footModel = volumeFooter($scope.dataModel);
        };


        /**
         * 3. Add Host Groups to VSM
         */

         var initAddHostGroupToVsm = function () {
            var hostGroupModel = {

                setStorageSystems: function (ss) {
                    var getSelectedItems = $scope.dataModel.getSelectedItems();
                    var index = _.indexOf(getSelectedItems, ss);
                    var selectedStorageSystem = getSelectedItems[index];
                    getSelectedItems.splice(index, 1);
                    getSelectedItems.unshift(selectedStorageSystem);
                    $scope.dataModel.getSelectedItems = function () {
                        return getSelectedItems;
                    };

                    orchestratorService.storagePorts(ss.storageSystemId).then(function (result) {
                        $scope.dataModel.getPorts = result.resources;
                    });

                },

                setStoragePort: function (sp) {
                    var getPorts = $scope.dataModel.getPorts;
                    var index = _.indexOf(getPorts, sp);
                    var selectedPort = getPorts[index];
                    getPorts.splice(index, 1);
                    getPorts.unshift(selectedPort);
                    $scope.dataModel.getPorts = getPorts;
                },

                updateAddedHostGroups: function () {
                    var addedHostGroups = {
                        hostGroups: [],
                        add: function () {
                            var storageSystemId = $scope.dataModel.getSelectedItems()[0].storageSystemId;
                            var storagePortId = $scope.dataModel.getPorts[0].storagePortId;
                            var numberOfHostGroups = $scope.dataModel.numberOfHostGroups;
                            addedHostGroups.hostGroups.push({
                                storageSystemId: storageSystemId,
                                storagePortId: storagePortId,
                                numberOfHostGroups: numberOfHostGroups
                            });
                        },
                        remove: function (index) {
                            $scope.dataModel.addedHostGroups.hostGroups.splice(index, 1);
                        }
                    };
                    if(_.isUndefined($scope.dataModel.addedHostGroups)) {
                        $scope.dataModel.addedHostGroups = addedHostGroups;
                    }
                    else {
                        var curHGs = $scope.dataModel.addedHostGroups.hostGroups;
                        $scope.dataModel.addedHostGroups.hostGroups = curHGs.concat(addedHostGroups.hostGroups);
                    }
                },

            };

            _.extend($scope.dataModel, hostGroupModel);

            var addHostGroupsToSelected = function () {
                $scope.selected.addHostGroupsToVsm = $scope.dataModel.addedHostGroups.hostGroups;
            };

            var createPaylaod = function () {
                var physicalStorageSystems = [];
                $scope.selected.addVolumesToVsm.forEach(function (vol) {
                    var hgs = _.filter($scope.selected.addHostGroupsToVsm, function (hg) {
                        return hg.storageSystemId === vol.storageSystemIds;
                    });

                    hgs.forEach(function (hg) {
                        physicalStorageSystems.push({
                            storageSystemId: vol.storageSystemIds,
                            numberOfVolumes: vol.numberOfVolumes,
                            hostGroups: [{
                                portId: hg.storagePortId,
                                number: hg.numberOfHostGroups
                            }]
                        });
                    });

                });
                var payload = {
                    storageSystemId: $scope.selected.serialNumber,
                    model: $scope.selected.selectedVirtualModel,
                    physicalStorageSystems: physicalStorageSystems
                };
                return payload;
            };

            var hostGroupFooter = function (dataModel) {
                return {
                    canSubmit: function () {
                        return !_.isUndefined($scope.dataModel.addedHostGroups);
                    },
                    submit: function () {
                        addHostGroupsToSelected();
                        var payload = createPaylaod();
                        orchestratorService.createVirtualStorageMachine(payload);
                    },
                    previous: function () {
                        initAddVolumesToVsm();
                        dataModel.goBack();
                    }
                };
            };

            $scope.footModel = hostGroupFooter($scope.dataModel);
        };

        initCommon();
    });

