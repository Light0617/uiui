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
 * @name rainierApp.controller:ExternalVolumesAddCtrl
 * @description
 * # ExternalVolumesAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp').controller('ExternalVolumesAddCtrl', function (
    $q, $scope, $window, $routeParams, externalVolumesAddService, utilService, viewModelService,
    storagePortsService, orchestratorService, objectTransformService, storageSystemCapabilitiesService,
    scrollDataSourceBuilderServiceNew, synchronousTranslateService, scrollDataSourceBuilderService,
    portDiscoverService, virtualizeVolumeService
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
            storageSystem: undefined,
            externalPorts: [],
            protocol: undefined,
            luns: [],
            hosts: [],
            hostMode: undefined,
            hostModeOptions: [],
            paths: []
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
                $scope.selected.storageSystem = result;
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
        return setupPortDataModelStatic()
            .then(onProtocolChange);
    };

    var onProtocolChange = function () {
        startSpinner();
        return getAndSetupPortDataModel($scope.selected.storageSystem, $scope.dataModel.selectedProtocol)
            .catch(externalVolumesAddService.openErrorDialog)
            .finally(stopSpinner);
    };

    var setupPortDataModelStatic = function () {
        return orchestratorService.storagePorts($scope.selected.storageSystem.storageSystemId).then(function (r) {
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
                externalVolumesAddService.setupSelectAllFunctionsDisplayList($scope.dataModel);
                $scope.filterModel.filterQuery('attributes', 'EXTERNAL_INITIATOR_PORT');
                $scope.dataModel.sort.setSort(storagePortsService.idKey);
                return true;
            })
            .then(function () {
                return externalVolumesAddService.validateGetPortsResult($scope.dataModel.displayList);
            });
    };

    var setupPortDataFilterFooterModel = function (portsModel) {
        _.extend($scope.dataModel, portsModel.dataModel);
        $scope.dataModel.sort.setSort = storagePortsService.generateSetSortFn($scope.dataModel);
        $scope.dataModel.updateResultTotalCounts = externalVolumesAddService.updateResultTotalCountsFn($scope.dataModel);
        $scope.footerModel = portsFooter($scope.dataModel);
        $scope.filterModel = storagePortsService.generateFilterModel($scope.dataModel);
        scrollDataSourceBuilderService.setupDataLoader($scope, portsModel.ports, 'storagePortSearch', true);
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
                initDiscoveredLuns()
                    .then($scope.dataModel.goNext)
                    .catch(externalVolumesAddService.openErrorDialog);
            }
        };
    };

    /**
     * 3. LUNS
     */
    var initDiscoveredLuns = function () {
        return externalVolumesAddService.openConfirmationDialog('This operation may take time, Proceed?')
            .then(function () {
                startSpinner();
                var portIds = _.map($scope.selected.externalPorts, 'storagePortId');
                return portDiscoverService.discoverUnmanagedLuns(portIds, $scope.selected.storageSystem.storageSystemId)
                    .then(externalVolumesAddService.validateGetLunsResult)
                    .then(setupLuns)
                    .then(autoSelectLuns)
                    .finally(stopSpinner);
            });
    };

    var setupLuns = function (lunsDataModel) {
        objectTransformService.transformDiscoveredLun(lunsDataModel);
        lunsDataModel = _.sortBy(lunsDataModel, ['hwInfo', 'lunId']);
        _.extend($scope.dataModel, externalVolumesAddService.getLunsDataModel(lunsDataModel));
        $scope.filterModel = undefined;
        $scope.footerModel = lunsFooter($scope.dataModel);
        scrollDataSourceBuilderServiceNew.setupDataLoader($scope, lunsDataModel, 'discoveredLunsSearch');
        scrollDataSourceBuilderService.setupDataLoader($scope, lunsDataModel, 'discoveredLunsSearch');
        externalVolumesAddService.setupSelectAllFunctionsFilteredList($scope.dataModel);
        return true;
    };

    var autoSelectLuns = function () {
        if (!$scope.selected.luns.length) {
            return true;
        }
        var selectedHash = _.indexBy($scope.selected.luns, 'searchKey');
        _.chain($scope.dataModel.displayList)
            .filter(function (i) {
                return selectedHash[i.searchKey];
            })
            .each(function (i) {
                i.selected = true;
            });
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
                _.forEach($scope.dataModel.unbinders, function (unbind) {
                    unbind();
                });
                initServers()
                    .then($scope.dataModel.goNext)
                    .catch(externalVolumesAddService.openErrorDialog);
            },
            previous: function () {
                initPorts()
                    .then($scope.dataModel.goBack)
                    .catch(externalVolumesAddService.openErrorDialog);
            }
        };
    };

    /**
     * 4. Servers
     */
    var initServers = function () {
        startSpinner();
        return getAndSetupHosts()
            .finally(stopSpinner);
    };

    var getAndSetupHosts = function () {
        return externalVolumesAddService.getHostsModel()
            .then(setupHosts)
            .then(function () {
                return externalVolumesAddService.validateGetHostsResult($scope.dataModel.displayList);
            })
            .then(setHostFilter)
            .then(autoSelectHost);
    };

    var setupHosts = function (hostsDataModel) {
        _.extend($scope.dataModel, hostsDataModel);
        $scope.dataModel.updateResultTotalCounts = externalVolumesAddService.updateResultTotalCountsFn($scope.dataModel);
        $scope.footerModel = hostsFooter($scope.dataModel);
        $scope.filterModel = externalVolumesAddService.getHostsFilterModel($scope.dataModel);
        scrollDataSourceBuilderService.setupDataLoader($scope, hostsDataModel.hosts, 'hostSearch');
        scrollDataSourceBuilderServiceNew.setupDataLoader($scope, hostsDataModel.hosts, 'hostSearch');
        externalVolumesAddService.setupSelectAllFunctionsDisplayList($scope.dataModel);
        return true;
    };

    var autoSelectHost = function () {
        if (!$scope.selected.hosts.length) {
            return true;
        }
        var selectedHash = _.indexBy($scope.selected.hosts, 'serverId');
        _.chain($scope.dataModel.displayList)
            .filter(function (i) {
                return selectedHash[i.serverId];
            })
            .each(function (i) {
                i.selected = true;
            });
        return true;
    };

    var setHostFilter = function () {
        $scope.filterModel.filterQuery('');
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
                externalVolumesAddService.checkSelectedHosts($scope.selected.hosts)
                    .then(initPaths)
                    .then($scope.dataModel.goNext)
                    .catch(externalVolumesAddService.openErrorDialog);
            },
            previous: function () {
                initDiscoveredLuns()
                    .then($scope.dataModel.goBack)
                    .catch(externalVolumesAddService.openErrorDialog);
            }
        };
    };

    /**
     * 5. Paths
     */
    var initPaths = function () {
        startSpinner();
        return getAndSetupPathsModel(
            $scope.selected.storageSystem.storageSystemId,
            $scope.selected.hosts,
            $scope.selected.hosts[0].protocol
        ).finally(stopSpinner);
    };

    var getAndSetupPathsModel = function (storageSystemId, hosts, protocol) {
        return externalVolumesAddService.getPathsModel(storageSystemId, hosts, protocol)
            .then(setupModel);
    };

    var setupModel = function (pathModel) {
        _.extend($scope.dataModel, pathModel);
        $scope.footerModel = pathsFooter();
        $scope.dataModel.selectedLuns = $scope.selected.luns;
        return true;
    };

    var pathsFooter = function () {
        return {
            validation: false,
            canSubmit: function () {
                var paths = virtualizeVolumeService.remainingPaths($scope.dataModel.pathModel.paths);
                return paths.length > 0 &&
                    $scope.dataModel.selectedHostModeOptions.length > 0 &&
                    !utilService.isNullOrUndef($scope.dataModel.selectedHostMode);
            },
            submit: function () {
                $scope.selected.hostMode = $scope.dataModel.selectedHostMode;
                $scope.selected.hostModeOptions = $scope.dataModel.selectedHostModeOptions;
                $scope.selected.paths = virtualizeVolumeService.remainingPaths($scope.dataModel.pathModel.paths);
                var payload = virtualizeVolumeService.constructVirtualizePayload($scope.selected);
                orchestratorService.virtualizeVolumes(
                    $scope.selected.storageSystem.storageSystemId,
                    payload
                ).then(function () {
                    backToPreviousView();
                });
            },
            previous: function () {
                initServers()
                    .then($scope.dataModel.goBack)
                    .catch(externalVolumesAddService.openErrorDialog);
            }
        };
    };

    initCommonAndPort();

});
