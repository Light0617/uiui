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
    scrollDataSourceBuilderServiceNew, synchronousTranslateService
) {
    /* INITIALIZATION */
    var backToPreviousView = function () {
        $window.history.back();
    };

    var init = function () {
        $scope.dataModel = viewModelService.newWizardViewModel([
            'selectPorts', 'selectEndPoints', 'selectLuns', 'selectServers', 'selectPaths'
        ]);
        $scope.dataModel.storageSystemId = extractStorageSystemId();
        setupStorageSystem($scope.dataModel.storageSystemId)
            .then(setupForFibre);

    };

    var setupStorageSystem = function (storageSystemId) {
        return orchestratorService.storageSystem(storageSystemId)
            .then(function (result) {
                $scope.storageSystem = result;
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

    /* 1. PORTS */
    var setupForFibre = function (storageSystem) {
        return getPortsModel(storageSystem, storagePortsService.initFibreDataModel)
            .then(setupPorts)
            .then(function () {
                return filterTargetPorts($scope.filterModel);
            });
    };

    var setupForIscsi = function (storageSystem) {
        return getPortsModel(storageSystem, storagePortsService.initFibreDataModel)
            .then(setupPorts)
            .then(function () {
                return filterTargetPorts($scope.filterModel);
            });
    };

    var setupPorts = function (portsModel) {
        _.extend($scope.dataModel, portsModel.dataModel);
        $scope.filterModel = portsModel.filterModel;
        $scope.footerModel = portsFooter($scope.dataModel);
        scrollDataSourceBuilderServiceNew.setupDataLoader($scope, portsModel.ports, 'storagePortSearch', true);

        return true;
    };

    var portsFooter = function (dataModel) {
        return {
            // confirmTitle: synchronousTranslateService.translate('select-discovered-volumes-confirmation'),
            // confirmMessage: synchronousTranslateService.translate('select-discovered-volumes'),
            validation: false,
            // itemSelected: false,
            canGoNext: function () {
                return _.some(dataModel.displayList, function (i) {
                    return i.selected;
                });
            },
            next: function () {
                console.log(dataModel);
            }
        }
    };

    var filterTargetPorts = function (filterModel) {
        filterModel.filterQuery('attributes', 'EXTERNAL_INITIATOR_PORT');
        return true;
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

    init();
});
