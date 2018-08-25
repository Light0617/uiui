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
            $scope.dataModel.selected = {
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
                var storageModel = createVsmService.setupStorageModel($scope.dataModel, storageSystems);
                $scope.dataModel.VirtualModelCandidates = constantService.virtualModelOptions();
                scrollDataSourceBuilderService.setupDataLoader($scope, storageSystems, 'storageSystemSearch');
                _.extend($scope.dataModel, storageModel);

                var storageFooter = function (dataModel) {
                    return {
                        canGoNext: function () {
                            return createVsmService.storageFooterCanGoNext(dataModel);
                        },
                        next: function () {
                            createVsmService.addPhysicalStorageSystemsToSelected($scope.dataModel);
                            if(!dataModel.sameModelSelection) {
                                createVsmService.checkVirtualSerialNumber(_.map(dataModel.getSelectedItems(),
                                                                                function (selected) {
                                                                                    return selected.storageSystemId;
                                                                                }), dataModel.serialNumber)
                                    .then(initAddVolumesToVsm)
                                    .then(dataModel.goNext)
                                    .catch(createVsmService.openErrorDialog);
                            }
                            else {
                                try {
                                    initAddVolumesToVsm();
                                    dataModel.goNext();
                                } catch (e) {
                                    createVsmService.openErrorDialog();
                                }
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
            var volumeModel = createVsmService.setupVolumeModel($scope.dataModel);
            _.extend($scope.dataModel, volumeModel);

            var setupGetPorts = function () {
                return orchestratorService.storagePorts($scope.dataModel.getSelectedItems()[0].storageSystemId)
                    .then(function (result) {
                        $scope.dataModel.getPorts = result.resources;
                    });
            };

            var volumeFooter = function (dataModel) {
                return {
                    canGoNext: function () {
                        return createVsmService.volumeFooterCanGoNext($scope.dataModel);
                    },
                    next: function () {
                        try {
                            createVsmService.addVolumesToSelected($scope.dataModel);
                            setupGetPorts();
                            initAddHostGroupToVsm();
                            dataModel.goNext();
                        } catch (e) {
                            createVsmService.openErrorDialog();
                        }
                    },
                    previous: function () {
                        initAddPhysicalStorageSystemView()
                            .then(createVsmService.recoverAddPhysicalStorageSystemView($scope.dataModel))
                            .then(dataModel.goBack)
                            .catch(createVsmService.openErrorDialog);
                    }
                };
            };
            $scope.footModel = volumeFooter($scope.dataModel);
        };

        /**
         * 3. Add Host Groups to VSM
         */
         var initAddHostGroupToVsm = function () {
            var hostGroupModel = createVsmService.setupHostGroupModel($scope.dataModel);
            _.extend($scope.dataModel, hostGroupModel);

            var hostGroupFooter = function (dataModel) {
                return {
                    canSubmit: function () {
                        return $scope.dataModel.hostGroups.length > 0;
                    },
                    submit: function () {
                        createVsmService.addHostGroupsToSelected($scope.dataModel);
                        var payload = createVsmService.createPayload($scope.dataModel.selected);
                        console.log('the payload is :', payload);
                        orchestratorService.createVirtualStorageMachine(payload);
                    },
                    previous: function () {
                        try {
                            initAddVolumesToVsm();
                            createVsmService.recoverAddVolumesToVsm($scope.dataModel);
                            dataModel.goBack();
                        } catch (e) {
                            createVsmService.openErrorDialog();
                        }
                    }
                };
            };
            $scope.footModel = hostGroupFooter($scope.dataModel);
        };

        initCommon();
    });

