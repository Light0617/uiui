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
 * @name rainierApp.controller:AddDefinedVolsToVsmCtrl
 * @description
 * # AddDefinedVolsToVsmCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp').controller('AddDefinedVolsToVsmCtrl', function (
    $scope, $modal, $routeParams, ShareDataService, orchestratorService, constantService, scrollDataSourceBuilderServiceNew,
    viewModelService, synchronousTranslateService, paginationService, queryService, objectTransformService,
    attachVolumeService, replicationService, externalVolumesAddService, $timeout){

    var virtualStorageMachineId = $routeParams.virtualStorageMachineId;
    var virtualStorageMachineIdList = virtualStorageMachineId.split('-');
    var virtualStorageSystemModel = virtualStorageMachineIdList[1];
    var physicalStorageSystemIds;

    var init = function(){
        $scope.selected = {
            physicalStorageSystemId: undefined,
            volumeIds: []
        };
        getPhysicalStorageSystemIds().then(initView);
    };

    var initView = function () {
        var dataModel = {
            title: 'Add Defined Volumes to VSM',
            view: 'tile',
            total: 0,
            virtualStorageSystemId: virtualStorageMachineId,
            virtualStorageSystemModel: virtualStorageSystemModel,
            physicalStorageSystemIds: physicalStorageSystemIds,
            selectedStorageSystem: '',
            search: {
                freeText: ''
            },
            changeSelectedStorageSystem: changeSelectedStorageSystem,
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
            gridSettings: [
                {
                    title: synchronousTranslateService.translate('virtual-storage-system-id'),
                    sizeClass: 'sixth',
                    sortField: 'virtualStorageMachineId',
                    getDisplayValue: function (item) {
                        return item.virtualStorageMachineId;
                    },
                    type: 'id'
                },
                {
                    title: synchronousTranslateService.translate('storage-systems-model'),
                    sizeClass: 'sixth',
                    sortField: 'productModel',
                    getDisplayValue: function (item) {
                        return item.model;
                    }

                }
            ],
        };


        $scope.dataModel = dataModel;

        $scope.footerModel = footer();
    };


    var getPhysicalStorageSystemIds = function () {
        return orchestratorService.virtualStorageMachines().then(function(result){
            var vsm = _.find(result.resources, function (r) {
                return r.virtualStorageMachineId === virtualStorageMachineId;
            });
            physicalStorageSystemIds = vsm.physicalStorageSystemIds;
            return vsm.physicalStorageSystemIds;
        });
    };

    var changeSelectedStorageSystem = function(){
        paginationService.get(null, 'volumes', objectTransformService.transformVolume, false, $scope.dataModel.selectedStorageSystem).then(function(result){
            _.forEach(result.resources, function(volume) {
                volume.selected = false;
            });

            $scope.dataModel.getResources = function(){
                queryService.setSort('volumeId', false);
                return paginationService.get($scope.dataModel.nextToken, 'volumes', objectTransformService.transformVolume,
                    false, $scope.dataModel.selectedStorageSystem.storageSystemId);
            };
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.total = result.total;
            $scope.dataModel.currentPageCount = 0;
            $scope.dataModel.cachedList = _.filter(result.resources, function(r){
                return (r.volumeId === r.virtualStorageMachineInformation.virtualVolumeId)
                    && (r.storageSystemId === r.virtualStorageMachineInformation.storageSystemId);
            });
            $scope.dataModel.displayList = $scope.dataModel.cachedList.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');
            $scope.dataModel.allItemsSelected = false;
        });
    };

    var constructAddDefinedVolumePayload = function(){
        return {
            physicalStorageSystemId: $scope.selected.physicalStorageSystemId,
            volumeIds: $scope.selected.volumeIds
        };
    };

    var footer = function () {
        return {
            validation: false,
            canSubmit: function () {
                //at least one volume is selected
                return _.some($scope.dataModel.displayList, 'selected');
            },
            submit: function () {
                $scope.selected.physicalStorageSystemId = $scope.dataModel.selectedStorageSystem;
                $scope.selected.volumeIds = _.map($scope.dataModel.displayList, function(v){
                    return v.volumeId;
                });
                var payload = constructAddDefinedVolumePayload();
                orchestratorService.addDefinedVolumeToVsm(virtualStorageMachineId, payload
                ).then(function(){
                    externalVolumesAddService.backToPreviousView();
                });
            }
        };
    };


    init();
});