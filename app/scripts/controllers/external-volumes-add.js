/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2017. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ExternalVolumesAddCtrl
 * @description
 * # ExternalVolumesAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp').controller('ExternalVolumesAddCtrl', function (
    $q, $scope, $window, $routeParams, externalVolumesAddService, utilService, viewModelService,
    storagePortsService, orchestratorService, objectTransformService, storageSystemCapabilitiesService,
    scrollDataSourceBuilderServiceNew, paginationService
) {
    var backToPreviousView = function () {
        $window.history.back();
    };

    var init = function () {
        $scope.dataModel = viewModelService.newWizardViewModel([
            'selectPorts', 'selectEndPoints', 'selectLuns', 'selectServers', 'selectPaths'
        ]);
        $scope.dataModel.storageSystemId = extractStorageSystemId();
        orchestratorService.storageSystem($scope.dataModel.storageSystemId)
            .then(getFibrePortsModel)
            .then(setupPorts)
    };

    var setupPorts = function (portsModel) {
        _.extend($scope.dataModel, portsModel.dataModel);
        $scope.filterModel = portsModel.filterModel;
        scrollDataSourceBuilderServiceNew.setupDataLoader($scope, portsModel.ports, 'storagePortSearch', true);
        return true;
    };

    var getStorageSystemModel = function (storageSystemId) {
        return orchestratorService.storageSystem(storageSystemId)
    };

    var getFibrePortsModel = function (storageSystem) {
        return getPortsModel(storageSystem, storagePortsService.initFibreDataModel);
    };

    var getIscsiPortsModel = function (storageSystem) {
        return getPortsModel(storageSystem, storagePortsService.initFibreDataModel);
    };

    var getPortsModel = function (storageSystem, initPortModelFn) {
        return initPortModelFn(storageSystem.storageSystemId)
            .then(function (result) {
                result.dataModel.showPortAttributeFilter = storageSystemCapabilitiesService.supportPortAttribute(storageSystem.model.storageSystemModel);
                result.dataModel = result.dataModel;
                result.filterModel = storagePortsService.generateFilterModel(result.dataModel);
                return result;
            });
    };


    var extractStorageSystemId = function () {
        var result = $routeParams.storageSystemId;
        if (utilService.isNullOrUndef(result)) {
            backToPreviousView();
        }
        return result;
    };

    init();
});
