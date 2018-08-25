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
                                                            ShareDataService,
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
                storageSystems:[],
                storageSystemIds : [],
                storageSystem: null,
                port: null,
                removeVolumesFromVsm: [],
                addHostGroupsToVsm: []
            };
            initRemovePhysicalStorageSystemView();
        };

        var getPhysicalStorageSystemIds = function () {
            //grunt serve --proxy-host=172.17.91.220 --proxy-use-https=true --allow-remote
            alert('qooo');
            return orchestratorService.virtualStorageMachine($routeParams.virtualStorageMachineId)
                .then(function (result) {
                    //alert(JSON.stringify(result));
                    $scope.dataModel.selected.storageSystemIds = result.resources[0].physicalStorageSystemIds; //mock
                    //$scope.dataModel.selected.storageSystemIds = result.physicalStorageSystemIds; //real
                    var promiseQueue = _.map($scope.dataModel.selected.storageSystemIds, function (storageSystemId) {
                        return orchestratorService.storageSystem(storageSystemId)
                            .then(function (result) {
                                //alert('xxxxx=' +  JSON.stringify(result));
                                $scope.dataModel.selected.storageSystems.push(result);
                                return result;
                        }).catch(function(e){
                            return new Error('error=' + e);
                        });
                    });

                    return $q.all(promiseQueue);
            });
        };

        /**
         * 0. init2, the helper method for initRemovePhysicalStorageSystemView
         */
        var init2 = function () {
            $scope.dataModel.selected.storageSystem = $scope.dataModel.selected.storageSystems[0];
            alert('selected storageSystem=\n' +  JSON.stringify($scope.dataModel.selected.storageSystem));
            getPhysicalStorageSystemSummary()
                .then(initRemoveVolumesFromVsm)
                .then($scope.dataModel.goNext)
                .catch(removeUndefinedResourcesService.openErrorDialog);
        };

        /**
         * 0. initRemovePhysicalStorageSystemView to init for initRemoveVolumesFromVsm
         */

        var initRemovePhysicalStorageSystemView = function () {
            getPhysicalStorageSystemIds()
                .then(init2)
                .catch(removeUndefinedResourcesService.openErrorDialog);
        };

        /**
         * 1. Remove Volumes from VSM
         */
        var initRemoveVolumesFromVsm = function () {
            var volumeModel = removeUndefinedResourcesService.setupVolumeModel($scope.dataModel);
            _.extend($scope.dataModel, volumeModel);

            var setupGetPorts = function () {
                alert($scope.dataModel.getSelectedItems());
                return orchestratorService.storagePorts($scope.dataModel.selected.storageSystemIds[0])
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

            var promiseQueue = _.map($scope.dataModel.selected.storageSystemIds, function (id) {
                return removeUndefinedResourcesService.getPhysicalStorageSystemSummary(virtualStorageMachineId,
                    id).then(function (result) {
                        alert('id=' + id);
                        alert(JSON.stringify(result));
                    $scope.dataModel.summaryModel[id] = result;
                    return result;
                }).catch(function(e){
                    $scope.dataModel.summaryModel[id] = e;
                });
            });

            return $q.all(promiseQueue);
        };

        /**
         * 2. Remove Host Groups to VSM
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