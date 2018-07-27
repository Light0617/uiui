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
    $scope, $modal, $routeParams, ShareDataService, orchestratorService, constantService,
    scrollDataSourceBuilderServiceNew, viewModelService, synchronousTranslateService, paginationService, queryService,
    objectTransformService, attachVolumeService, replicationService, externalVolumesAddService){

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
            changeSelectedStorageSystem: changeSelectedStorageSystem
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
        var dataModel = $scope.dataModel;
        paginationService.get(null, 'volumes', objectTransformService.transformVolume, false,
            dataModel.selectedStorageSystem).then(
            function(result){
                _.forEach(result.resources, function(volume) {
                    volume.selected = false;
                });

                dataModel.getResources = function(){
                    queryService.setSort('volumeId', false);
                    return paginationService.get(dataModel.nextToken, 'volumes', objectTransformService.transformVolume,
                        false, dataModel.selectedStorageSystem.storageSystemId);
                };
                dataModel.nextToken = result.nextToken;
                dataModel.total = result.total;
                dataModel.currentPageCount = 0;
                dataModel.cachedList = _.filter(result.resources, function(r){
                    return (r.volumeId === r.virtualStorageMachineInformation.virtualVolumeId) &&
                        (r.storageSystemId === r.virtualStorageMachineInformation.storageSystemId);
                });
                dataModel.displayList = dataModel.cachedList.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');
                dataModel.allItemsSelected = false;
                $scope.dataModel = dataModel;
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