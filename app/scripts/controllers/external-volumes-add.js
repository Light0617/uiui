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
    scrollDataSourceBuilderServiceNew, synchronousTranslateService, scrollDataSourceBuilderService,
    portDiscoverService
) {
    /**
     * 1. initCommonAndPort
     * 2. initPorts > next()
     * 3. TBD: SCOPE DISCUSSING initWwns
     * 4. previous() < initLuns  > next()
     * 5. previous() < initServers  > next()
     * 6. previous() < initPaths  > submit()
     */

    /* UTILITIES */
    var backToPreviousView = function () {
        $window.history.back();
    };

    var startSpinner = function () {
        spinner(true);
    };

    var stopSpinner = function () {
        spinner(false);
    };

    var spinner = function (enable) {
        if ($scope.dataModel) {
            $scope.dataModel.isWaiting = enable;
        }
    };

    var filterSelected = function (i) {
        return i.selected;
    };

    /* INITIALIZATION */
    var initCommonAndPort = function () {
        $scope.dataModel = viewModelService.newWizardViewModel([
            'selectPorts', 'selectLuns', 'selectServers', 'selectPaths'
        ]);
        $scope.selected = {
            externalPorts: [],
            protocol: undefined,
            luns: []
        };
        startSpinner();
        var storageSystemId = extractStorageSystemId();

        setupStorageSystem(storageSystemId)
            .then(initPorts)
            .finally(stopSpinner);
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

    /**
     *  1. PORTS GET/SETUPS
     */
    var initPorts = function () {
        startSpinner();
        setupPortDataModelStatic();
        return getAndSetupPortDataModel($scope.storageSystem, $scope.dataModel.selectedProtocol)
            .finally(stopSpinner);
    };

    var setupPortDataModelStatic = function () {
        var staticProperties = {
            protocolCandidates: getProtocolCandidates(),
            onProtocolChange: initPorts
        };
        staticProperties.selectedProtocol = staticProperties.protocolCandidates[0].key;
        _.extend($scope.dataModel, staticProperties);
        return $scope.dataModel;
    };

    var getProtocolCandidates = function () {
        // TODO get availabe protocol to get ports, if length === 0, show dialog
        return _.map(['FIBRE', 'ISCSI'], function (key) {
            return {
                key: key,
                display: synchronousTranslateService.translate(key)
            };
        });
    };

    var getAndSetupPortDataModel = function (storageSystem, protocol) {
        return getPortsModel(storageSystem, protocol)
            .then(setupPortDataFilterFooterModel)
            .then(function () {
                return filterTargetPorts($scope.filterModel);
            });
    };

    var setupPortDataFilterFooterModel = function (portsModel) {
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
                return _.some(dataModel.displayList, filterSelected);
            },
            next: function () {
                // TODO warnings for taking time
                $scope.selected.externalPorts = _.filter(dataModel.displayList, filterSelected);
                $scope.selected.protocol = $scope.dataModel.selectedProtocol;
                initDiscoveredLuns();
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

    /**
     * 3. LUNS
     */
    var initDiscoveredLuns = function () {
        startSpinner();
        var portIds = _.map($scope.selected.externalPorts, 'storagePortId');
        portDiscoverService.discoverUnmanagedLuns(portIds, $scope.storageSystem.storageSystemId)
            .then(validateGetLunsResult)
            .then(setupLuns)
            .then($scope.dataModel.goNext)
            .finally(stopSpinner);
    };

    var setupLuns = function (luns) {
        objectTransformService.transformDiscoveredLun(luns);
        _.extend($scope.dataModel, getLunsDataModel(luns));
        $scope.filterModel = undefined;
        $scope.footerModel = lunsFooter($scope.dataModel);
        scrollDataSourceBuilderService.setupDataLoader($scope, luns, 'discoveredLunsSearch');
        return true;
    };

    var getLunsDataModel = function (luns) {
        return {
            displayList: luns,
            cachedList: luns,
            search: {
                freeText: ''
            }
        };
    };

    var validateGetLunsResult = function (luns) {
        if (!luns.length) {
            openDialogForFialedToDiscovery();
            return $q.reject();
        }
        return luns;
    };

    var openDialogForFialedToDiscovery = function () {
        // TODO
    };

    var lunsFooter = function (dataModel) {
        return {
            validation: false,
            canGoNext: function () {
                return _.some(dataModel.filteredList, filterSelected);
            },
            next: function () {
                $scope.selected.luns = _.filter(dataModel.filteredList, filterSelected);
                console.log('hi');
            }
        };
    };

    /**
     * 4. Servers
     */
    var initServers = function () {

    };

    /**
     * 5. Paths
     */
    var initPaths = function () {

    };

    initCommonAndPort();

});
