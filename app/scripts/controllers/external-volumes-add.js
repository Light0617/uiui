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
            .then(setupPortDataModelStatic)
            .then(onProtocolChange);
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

    /* 1. PORTS GET/SETUPS*/
    var onProtocolChange = function () {
        return getAndSetupPortDataModel($scope.storageSystem, $scope.dataModel.selectedProtocol);
    };

    var setupPortDataModelStatic = function () {
        var staticProperties = {
            protocolCandidates: getProtocolCandidates(),
            onProtocolChange: onProtocolChange
        };
        staticProperties.selectedProtocol = staticProperties.protocolCandidates[0].key;
        _.extend($scope.dataModel, staticProperties);
        return $scope.dataModel;
    };

    var getProtocolCandidates = function () {
        return _.map(['FIBRE', 'ISCSI'], function (key) {
            return {
                key: key,
                display: synchronousTranslateService.translate(key)
            };
        });
    };

    var getAndSetupPortDataModel = function (storageSystem, protocol) {
        return getPortsModel(storageSystem, protocol)
            .then(setupPortDataModel)
            .then(function () {
                return filterTargetPorts($scope.filterModel);
            });
    };

    var setupPortDataModel = function (portsModel) {
        _.extend($scope.dataModel, portsModel.dataModel);
        $scope.filterModel = portsModel.filterModel;
        $scope.footerModel = portsFooter($scope.dataModel);
        scrollDataSourceBuilderServiceNew.setupDataLoader($scope, portsModel.ports, 'storagePortSearch', true);

        return true;
    };

    var portsFooter = function (dataModel) {
        return {
            validation: false,
            canGoNext: function () {
                return _.some(dataModel.displayList, function (i) {
                    return i.selected;
                });
            },
            next: function () {
                console.log(dataModel);
            }
        };
    };

    var filterTargetPorts = function (filterModel) {
        filterModel.filterQuery('attributes', 'EXTERNAL_INITIATOR_PORT');
        return true;
    };

    var getPortsModel = function (storageSystem, protocol) {
        return storagePortsService.initDataModel(storageSystem.storageSystemId, protocol)
            .then(function (result) {
                result.dataModel.showPortAttributeFilter = storageSystemCapabilitiesService.supportPortAttribute(storageSystem.model.storageSystemModel);
                result.dataModel = result.dataModel;
                result.filterModel = storagePortsService.generateFilterModel(result.dataModel);
                return result;
            });
    };

    init();
});
