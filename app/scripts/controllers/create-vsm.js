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
        /*
         * 0. Initial process for all pages
         */
        var init = function () {

        };

        /*
         * 1. Add Physical Storage Systems
         */
        var initAddPhysicalStorageSystemView = function () {
            var GET_STORAGE_SYSTEM_PATH = 'storage-systems';

            paginationService.getAllPromises(null,
                GET_STORAGE_SYSTEM_PATH,
                true,
                null,
                objectTransformService.transformStorageSystem)
                .then(function (result) {

                    var storageSystems = result;
                    var hasFileUsageBar = false;

                    var dataModel = {
                        validationForm: {
                            serialNumber: ''
                        },
                        payload: {
                            serialNumber: '',
                            selectedVirtualModel: '',
                            physicalStorageSystems: []
                        },
                        view: 'tile',
                        hasFileUsageBar: hasFileUsageBar,
                        displayList: result,
                        sameModelSelection: false,
                        virtualModel: {},
                        subTitle: 'Add Volume Ids From Each Storage Systems',
                        serialNumber: '',
                        getPorts: [],
                        remove: function (index) {
                            $scope.dataModel.hostGroupsModel.hostGroups.splice(index, 1);
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
                        },

                        canGoNext: function () {
                            return true;
                        },
                        next: function () {
                            if (dataModel.sameModelSelection) {
                                dataModel.goNext();
                            }
                            else {
                                createVsmService.checkVirtualSerialNumber(
                                    _.map(dataModel.getSelectedItems(), function (selected) {
                                        return selected.storageSystemId;
                                    }),
                                    dataModel.payload.serialNumber
                                )
                                    .then(dataModel.goNext)
                                    .catch(createVsmService.openErrorDialog);
                            }
                        },
                        previous: function () {
                            dataModel.goBack();
                        },
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
                            },
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
                            if ($scope.dataModel.payload.selectedVirtualModel !== undefined) {
                                var key = $scope.dataModel.payload.selectedVirtualModel;
                                var selected = createVsmService.vsmModelRange[key];
                                $scope.dataModel.placeholder = selected.min + ' to ' + selected.max;
                            }
                        },
                        updateSelectedStorageSystem: function () {
                            if ($scope.dataModel.useSameModel !== null || $scope.dataModel.useSameModel !== undefined) {
                                var useSameModel = $scope.dataModel.useSameModel;
                                $scope.dataModel.payload.serialNumber = useSameModel.storageSystemId;
                                $scope.dataModel.payload.selectedVirtualModel = useSameModel.model;
                            }
                        },
                        updateHostGroupsModel: function () {
                            var hostGroupsModel = {
                                hostGroups: [],
                                add: function () {
                                    var storageSystemId = $scope.dataModel.getSelectedItems()[0].storageSystemId;
                                    var storagePortId = $scope.dataModel.getPorts[0].storagePortId;
                                    var numberOfHostGroups = $scope.dataModel.numberOfHostGroups;
                                    hostGroupsModel.hostGroups.push({
                                        storageSystemId: storageSystemId,
                                        storagePortId: storagePortId,
                                        numberOfHostGroups: numberOfHostGroups
                                    });
                                },
                            };
                            $scope.dataModel.hostGroupsModel = hostGroupsModel;
                        }
                    };

                    angular.extend(dataModel, viewModelService.newWizardViewModel(['addPhysicalStorageSystems', 'addVolumesToVsm', 'addHostGroupsToVsm']));

                    dataModel.VirtualModelCandidates = constantService.virtualModelOptions();

                    var vsmModelRange = createVsmService.vsmModelRange;

                    dataModel.vsmModelRange = vsmModelRange;


                    $scope.dataModel = dataModel;


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

                });

        };

        /*
         * 2. Add Volumes to VSM
         */
        var initAddVolumesToVsm = function () {};

        /*
         * 3. Add Host Groups to VSM
         */
        var initAddHostGroupToVsm = function () {};

        initAddPhysicalStorageSystemView();

    });

