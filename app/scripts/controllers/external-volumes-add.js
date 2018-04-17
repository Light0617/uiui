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
        setupPortDataModelStatic().then(onProtocolChange);
    };

    var onProtocolChange = function () {
        startSpinner();
        return getAndSetupPortDataModel($scope.storageSystem, $scope.dataModel.selectedProtocol)
            .catch(externalVolumesAddService.openErrorDialog)
            .finally(stopSpinner);
    };

    var setupPortDataModelStatic = function () {
        return orchestratorService.storagePorts($scope.storageSystem.storageSystemId).then(function (r) {
            var staticProperties = {
                protocolCandidates: externalVolumesAddService.getProtocolCandidates(),
                onProtocolChange: onProtocolChange
            };
            if (r.resources && r.resources[0]) {
                staticProperties.selectedProtocol = r.resources[0].type;
            } else {
                staticProperties.selectedProtocol = staticProperties.protocolCandidates[0].key;
            }
            _.extend($scope.dataModel, staticProperties);
            return $scope.dataModel;
        });
    };

    var getAndSetupPortDataModel = function (storageSystem, protocol) {
        return externalVolumesAddService.getPortsModel(storageSystem, protocol)
            .then(setupPortDataFilterFooterModel)
            .then(function () {
                $scope.filterModel.filterQuery('attributes', 'EXTERNAL_INITIATOR_PORT');
                return true;
            })
            .then(function () {
                return externalVolumesAddService.validateGetPortsResult($scope.dataModel.displayList);
            });
    };

    var setupPortDataFilterFooterModel = function (portsModel) {
        _.extend($scope.dataModel, portsModel.dataModel);
        $scope.dataModel.updateResultTotalCounts = externalVolumesAddService.updateResultTotalCountsFn($scope.dataModel);
        $scope.footerModel = portsFooter($scope.dataModel);
        $scope.filterModel = storagePortsService.generateFilterModel($scope.dataModel);
        scrollDataSourceBuilderServiceNew.setupDataLoader($scope, portsModel.ports, 'storagePortSearch', true);

        return true;
    };

    var portsFooter = function (dataModel) {
        return {
            validation: false,
            canGoNext: function () {
                return _.some(dataModel.displayList, externalVolumesAddService.filterSelected);
            },
            next: function () {
                $scope.selected.externalPorts = _.filter(dataModel.displayList, externalVolumesAddService.filterSelected);
                $scope.selected.protocol = $scope.dataModel.selectedProtocol;
                initDiscoveredLuns();
            }
        };
    };

    /**
     * 3. LUNS
     */
    var initDiscoveredLuns = function () {
        externalVolumesAddService.openConfirmationDialog('This operation may take time, Proceed?')
            .then(function () {
                startSpinner();
                var portIds = _.map($scope.selected.externalPorts, 'storagePortId');
                portDiscoverService.discoverUnmanagedLuns(portIds, $scope.storageSystem.storageSystemId)
                    .then(externalVolumesAddService.validateGetLunsResult)
                    .then(setupLuns)
                    .then($scope.dataModel.goNext)
                    .catch(externalVolumesAddService.handleDiscoverError)
                    .finally(stopSpinner);
            });
    };

    var setupLuns = function (lunsDataModel) {
        objectTransformService.transformDiscoveredLun(lunsDataModel);
        _.extend($scope.dataModel, externalVolumesAddService.getLunsDataModel(lunsDataModel));
        $scope.filterModel = undefined;
        $scope.footerModel = lunsFooter($scope.dataModel);
        scrollDataSourceBuilderService.setupDataLoader($scope, lunsDataModel, 'discoveredLunsSearch');
        return true;
    };

    var lunsFooter = function (dataModel) {
        return {
            validation: false,
            canGoNext: function () {
                return _.some(dataModel.filteredList, externalVolumesAddService.filterSelected);
            },
            next: function () {
                $scope.selected.luns = _.filter(dataModel.filteredList, externalVolumesAddService.filterSelected);
                initServers();
            }
        };
    };

    /**
     * 4. Servers
     */
    var initServers = function () {
        // startSpinner();
        getAndSetupHosts()
            .then($scope.dataModel.goNext)
            .finally(stopSpinner);
    };

    var getAndSetupHosts = function () {
        return externalVolumesAddService.getHostsModel()
            .then(setupHosts);
    };

    var setupHosts = function (hostsDataModel) {
        _.extend($scope.dataModel, hostsDataModel);
        $scope.dataModel.updateResultTotalCounts = externalVolumesAddService.updateResultTotalCountsFn($scope.dataModel);
        $scope.footerModel = hostsFooter(hostsDataModel);
        $scope.filterModel = externalVolumesAddService.getHostsFilterModel($scope.dataModel);
        scrollDataSourceBuilderServiceNew.setupDataLoader($scope, hostsDataModel.hosts, 'hostSearch');
        return true;
    };

    var hostsFooter = function (dataModel) {
        return {
            validation: false,
            canGoNext: function () {
                return _.some(dataModel.displayList, externalVolumesAddService.filterSelected);
            },
            next: function () {
                $scope.selected.hosts = _.filter(dataModel.displayList, externalVolumesAddService.filterSelected);
                console.log('hi');
            }
        };
    };

    /**
     * 5. Paths
     */
    var initPaths = function () {

    };

    initCommonAndPort();

});
