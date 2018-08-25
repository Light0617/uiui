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
 * @name rainierApp.controller:AddUndefinedResourcesToVsmCtrl
 * @description
 * # AddUndefinedResourcesToVsmCtrl
 * Controller of the rainierApp
 */

angular.module('rainierApp')
    .controller('AddUndefinedResourcesToVsmCtrl', function ($scope,
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
                                                            $routeParams,
                                                            addUndefinedResourcesService,
                                                            $q) {
        /**
         * 0. Initial process for all pages
         */

        var initCommon = function () {
            $scope.dataModel = viewModelService.newWizardViewModel(['addPhysicalStorageSystems',
                'addVolumesToVsm',
                'addHostGroupsToVsm']);
            $scope.dataModel.selected = {
                displayList: [],
                storageSystems:[],
                storageSystem: null,
                port: null,
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
                var virtualStorageMachineId = $routeParams.virtualStorageMachineId;
                var virtualStorageMachineIdList = virtualStorageMachineId.split('-');
                var virtualStorageSystemModel = virtualStorageMachineIdList[1];
                var storageModel = addUndefinedResourcesService.setupStorageModel($scope.dataModel,
                    result,
                    virtualStorageMachineId,
                    virtualStorageSystemModel);
                _.extend($scope.dataModel, storageModel);
                scrollDataSourceBuilderService.setupDataLoader($scope, storageSystems, 'storageSystemSearch');

                var storageFooter = function (dataModel) {
                    return {
                        canGoNext: function () {
                            return dataModel.getSelectedItems().length > 0;
                        },
                        next: function () {
                            addUndefinedResourcesService.addPhysicalStorageSystemsToSelected($scope.dataModel);
                            getPhysicalStorageSystemSummary()
                                .then(initAddVolumesToVsm)
                                .then($scope.dataModel.goNext)
                                .catch(addUndefinedResourcesService.openErrorDialog);
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
            var volumeModel = addUndefinedResourcesService.setupVolumeModel($scope.dataModel);
            _.extend($scope.dataModel, volumeModel);

            var setupGetPorts = function () {
                return orchestratorService.storagePorts($scope.dataModel.getSelectedItems()[0].storageSystemId)
                    .then(function (result) {
                        $scope.dataModel.getPorts = result.resources;
                        $scope.dataModel.selected.port = $scope.dataModel.getPorts[0];
                    });
            };

            var recoverAddPhysicalStorageSystemView = function () {
                _.extend($scope.dataModel.displayList, $scope.dataModel.selected.displayList);
                return true;
            };

            var volumeFooter = function (dataModel) {
                return {
                    canGoNext: function () {
                        return true;
                    },
                    next: function () {
                        try {
                            addUndefinedResourcesService.addVolumesToSelected($scope.dataModel);
                            dataModel.goNext();
                            initAddHostGroupToVsm();
                            setupGetPorts();
                        } catch (e) {
                            addUndefinedResourcesService.openErrorDialog();
                        }
                    },
                    previous: function () {
                        initAddPhysicalStorageSystemView()
                            .then(recoverAddPhysicalStorageSystemView)
                            .then(dataModel.goBack)
                            .catch(addUndefinedResourcesService.openErrorDialog);
                    }
                };
            };
            $scope.footModel = volumeFooter($scope.dataModel);

            return $q.resolve(true);
        };

        var getPhysicalStorageSystemSummary = function(){
            $scope.dataModel.summaryModel = {};
            var virtualStorageMachineId = $routeParams.virtualStorageMachineId;

            var promise_queue = _.map($scope.dataModel.selected.storageSystems, function (ss) {
                alert(JSON.stringify(ss));
                    return addUndefinedResourcesService.getPhysicalStorageSystemSummary(virtualStorageMachineId,
                            ss.storageSystemId).then(function (result) {
                                alert(JSON.stringify(result));
                                $scope.dataModel.summaryModel[ss.storageSystemId] = result;
                                return result;
                            }).catch(function(e){
                                $scope.dataModel.summaryModel[ss.storageSystemId] = e;
                            });
            });

            return $q.all(promise_queue);
        }

        /**
         * 3. Add Host Groups to VSM
         */
        var initAddHostGroupToVsm = function () {
            var hostGroupModel = addUndefinedResourcesService.setupHostGroupModel($scope.dataModel);
            _.extend($scope.dataModel, hostGroupModel);

            var hostGroupFooter = function (dataModel) {
                return {
                    canSubmit: function () {
                        return true;
                    },
                    submit: function () {
                        addUndefinedResourcesService.addHostGroupsToSelected($scope.dataModel);
                        var payload = addUndefinedResourcesService.createPayload($scope.dataModel);
                        var virtualStorageMachineId = $routeParams.virtualStorageMachineId;
                        orchestratorService.addUndefinedResources(virtualStorageMachineId, payload);
                    },
                    previous: function () {
                        try{
                            initAddVolumesToVsm();
                            dataModel.goBack();
                        } catch (e) {
                            addUndefinedResourcesService.openErrorDialog();
                        }
                    }
                };
            };
            $scope.footModel = hostGroupFooter($scope.dataModel);
        };

        initCommon();
    });