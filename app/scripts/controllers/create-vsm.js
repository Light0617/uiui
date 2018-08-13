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
                                           scrollDataSourceBuilderService,
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
                displayList: [],
                sameModelSelection: false,
                serialNumber: undefined,
                selectedVirtualModel: undefined,
                useExistingStorage: undefined,
                numberOfVolumes: [],
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

            return paginationService.getAllPromises(null,
                                             GET_STORAGE_SYSTEM_PATH,
                                             true,
                                             null,
                                             objectTransformService.transformStorageSystem).then(function (result) {

                var storageSystems = result;
                var hasFileUsageBar = false;

                var storageModel = {
                    sameModelSelection: false,
                    serialNumber: undefined,
                    selectedVirtualModel: undefined,
                    view: 'tile',                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
                    hasFileUsageBar: hasFileUsageBar,
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

                scrollDataSourceBuilderService.setupDataLoader($scope, storageSystems, 'storageSystemSearch');

                _.extend($scope.dataModel, storageModel);

                var addPhysicalStorageSystemsToSelected = function () {
                    $scope.selected.displayList = $scope.dataModel.displayList;
                    $scope.selected.sameModelSelection = $scope.dataModel.sameModelSelection;
                    $scope.selected.selectedVirtualModel = $scope.dataModel.selectedVirtualModel;
                    $scope.selected.serialNumber = $scope.dataModel.serialNumber;
                };

                var storageFooter = function (dataModel) {
                    return {
                        canGoNext: function () {
                            var virtualSerialNumberCheck = _.isUndefined (dataModel.validationForm.$error.number) ?
                                true : !dataModel.validationForm.$error.number;
                            return(
                                !_.isUndefined(dataModel.serialNumber) &&
                                !_.isUndefined(dataModel.selectedVirtualModel) &&
                                dataModel.getSelectedItems().length > 0 &&
                                virtualSerialNumberCheck);
                        },
                        next: function () {
                            addPhysicalStorageSystemsToSelected();
                            if(!dataModel.sameModelSelection) {
                                createVsmService.checkVirtualSerialNumber(
                                    _.map(dataModel.getSelectedItems(), function (selected) {
                                        return selected.storageSystemId;
                                    }), dataModel.serialNumber)
                                    .then(function () {
                                        initAddVolumesToVsm();
                                    })
                                    .then(function () {
                                        return dataModel.goNext();
                                    })
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
                subTitle: 'Add Volumes From Each Storage System',
                selectedItems: $scope.dataModel.getSelectedItems(),
                storageSystemId: $scope.dataModel.getSelectedItems(),
                numberOfVolumes: []
            };

            _.extend($scope.dataModel, volumeModel);

            var addVolumesToSelected = function () {
                $scope.selected.numberOfVolumes = $scope.dataModel.numberOfVolumes;
                _.each($scope.dataModel.numberOfVolumes, function (val, i) {
                    var element = {
                        storageSystemIds: $scope.dataModel.storageSystemId[i].storageSystemId,
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

            var recoverAddPhysicalStorageSystemView = function () {
                _.extend($scope.dataModel.displayList, $scope.selected.displayList);
                $scope.dataModel.selectedVirtualModel = $scope.selected.selectedVirtualModel;
                $scope.dataModel.serialNumber = $scope.selected.serialNumber;
                return true;
            };

            var volumeFooter = function (dataModel) {
                return {
                    canGoNext: function () {
                        return $scope.dataModel.numberOfVolumes.length ===  $scope.dataModel.selectedItems.length &&
                            !_.contains($scope.dataModel.numberOfVolumes, null) &&
                            _.every($scope.dataModel.numberOfVolumes, function (num) {
                                return num >= 0 && num <=65000;
                            });
                    },
                    next: function () {
                        addVolumesToSelected();
                        setupGetPorts();
                        initAddHostGroupToVsm();
                        dataModel.goNext();
                    },
                    previous: function () {
                        initAddPhysicalStorageSystemView()
                            .then(recoverAddPhysicalStorageSystemView)
                            .then(function () {
                                return dataModel.goBack();
                            });
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
                subTitle: 'Add Host Group From Each Storage System',
                hostGroups: [],
                add: function () {
                    var storageSystemId = $scope.dataModel.getSelectedItems()[0].storageSystemId;
                    var storagePortId = $scope.dataModel.getPorts[0].storagePortId;
                    var numberOfHostGroups = $scope.dataModel.numberOfHostGroups;
                    $scope.dataModel.hostGroups.push({
                        storageSystemId: storageSystemId,
                        storagePortId: storagePortId,
                        numberOfHostGroups: numberOfHostGroups
                    });
                },
                remove: function (index) {
                    $scope.dataModel.hostGroups.splice(index, 1);
                },
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
                }
            };

            _.extend($scope.dataModel, hostGroupModel);

            var addHostGroupsToSelected = function () {
                $scope.selected.addHostGroupsToVsm = $scope.dataModel.hostGroups;
            };

            var recoverAddVolumesToVsm = function () {
                $scope.dataModel.numberOfVolumes = $scope.selected.numberOfVolumes;
                $scope.selected.addVolumesToVsm = [];
            };

            var hostGroupFooter = function (dataModel) {
                return {
                    canSubmit: function () {
                        return $scope.dataModel.hostGroups.length > 0;
                    },
                    submit: function () {
                        addHostGroupsToSelected();
                        var payload = createVsmService.createPayload($scope.selected);
                        orchestratorService.createVirtualStorageMachine(payload);
                    },
                    previous: function () {
                        initAddVolumesToVsm();
                        recoverAddVolumesToVsm();
                        dataModel.goBack();
                    }
                };
            };

            $scope.footModel = hostGroupFooter($scope.dataModel);
        };

        initCommon();
    });

