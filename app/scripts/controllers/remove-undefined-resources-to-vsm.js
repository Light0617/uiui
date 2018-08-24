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
 * @name rainierApp.controller:RemoveUndefinedResourcesToVsmCtrl
 * @description
 * # RemoveUndefinedResourcesToVsmCtrl
 * Controller of the rainierApp
 */

angular.module('rainierApp')
    .controller('RemoveUndefinedResourcesToVsmCtrl', function ($scope,
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
                                                            removeUndefinedResourcesService,
                                                            $q) {
        /**
         * 0. Initial process for all pages
         */

        var initCommon = function () {
            $scope.dataModel = viewModelService.newWizardViewModel(['removePhysicalStorageSystems',
                'removeVolumesFromVsm',
                'removeHostGroupsFromVsm']);
            $scope.dataModel.selected = {
                displayList: [],
                storageSystemsIds: [],
                storageSystems:[],
                storageSystem: null,
                port: null,
                removeVolumesFromVsm: [],
                addHostGroupsToVsm: []
            };
            initRemovePhysicalStorageSystemView();
        };

        /**
         * 1. Remove Physical Storage Systems
         */
        var initRemovePhysicalStorageSystemView = function () {
            var GET_STORAGE_SYSTEM_PATH = 'storage-systems';
            //alert(ShareDataService.virtualStorageMachine.physicalStorageSystemIds);
            return paginationService.getAllPromises(null,
                GET_STORAGE_SYSTEM_PATH,
                true,
                null,
                objectTransformService.transformStorageSystem).then(function (result) {
                var storageSystems = result;
                var virtualStorageMachineId = $routeParams.virtualStorageMachineId;
                var virtualStorageMachineIdList = virtualStorageMachineId.split('-');
                var virtualStorageSystemModel = virtualStorageMachineIdList[1];
                var storageModel = removeUndefinedResourcesService.setupStorageModel($scope.dataModel,
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
                            removeUndefinedResourcesService.addPhysicalStorageSystemsToSelected($scope.dataModel);
                            getPhysicalStorageSystemSummary()
                                .then(initRemoveVolumesFromVsm)
                                .then($scope.dataModel.goNext)
                                .catch(removeUndefinedResourcesService.openErrorDialog);
                        }
                    };
                };
                $scope.footModel = storageFooter($scope.dataModel);
            });
        };

        /**
         * 2. Remove Volumes from VSM
         */
        var initRemoveVolumesFromVsm = function () {
            var volumeModel = removeUndefinedResourcesService.setupVolumeModel($scope.dataModel);
            _.extend($scope.dataModel, volumeModel);

            var setupGetPorts = function () {
                return orchestratorService.storagePorts($scope.dataModel.getSelectedItems()[0].storageSystemId)
                    .then(function (result) {
                        $scope.dataModel.getPorts = result.resources;
                        $scope.dataModel.selected.port = $scope.dataModel.getPorts[0];
                    });
            };

            var recoverRemovePhysicalStorageSystemView = function () {
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
                            removeUndefinedResourcesService.removeVolumesFromSelected($scope.dataModel);
                            dataModel.goNext();
                            initRemoveHostGroupToVsm();
                            setupGetPorts();
                        } catch (e) {
                            removeUndefinedResourcesService.openErrorDialog();
                        }
                    },
                    previous: function () {
                        initRemovePhysicalStorageSystemView()
                            .then(recoverRemovePhysicalStorageSystemView)
                            .then(dataModel.goBack)
                            .catch(removeUndefinedResourcesService.openErrorDialog);
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
                return removeUndefinedResourcesService.getPhysicalStorageSystemSummary(virtualStorageMachineId,
                    ss.storageSystemId).then(function (result) {
                    $scope.dataModel.summaryModel[ss.storageSystemId] = result;
                    return result;
                }).catch(function(e){
                    $scope.dataModel.summaryModel[ss.storageSystemId] = e;
                });
            });

            return $q.all(promise_queue);
        }

        /**
         * 3. Remove Host Groups to VSM
         */
        var initRemoveHostGroupToVsm = function () {
            var hostGroupModel = removeUndefinedResourcesService.setupHostGroupModel($scope.dataModel);
            _.extend($scope.dataModel, hostGroupModel);

            var hostGroupFooter = function (dataModel) {
                return {
                    canSubmit: function () {
                        return true;
                    },
                    submit: function () {
                        removeUndefinedResourcesService.addHostGroupsToSelected($scope.dataModel);
                        var payload = removeUndefinedResourcesService.createPayload($scope.dataModel);
                        var virtualStorageMachineId = $routeParams.virtualStorageMachineId;
                        orchestratorService.addUndefinedResources(virtualStorageMachineId, payload);
                    },
                    previous: function () {
                        try{
                            initRemoveVolumesFromVsm();
                            dataModel.goBack();
                        } catch (e) {
                            removeUndefinedResourcesService.openErrorDialog();
                        }
                    }
                };
            };
            $scope.footModel = hostGroupFooter($scope.dataModel);
        };

        initCommon();
    });