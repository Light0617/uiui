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
    portDiscoverService, paginationService
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
        setupPortDataModelStatic().then(onProtocolChange);
    };

    var onProtocolChange = function () {
        startSpinner();
        return getAndSetupPortDataModel($scope.storageSystem, $scope.dataModel.selectedProtocol)
            // .catch() // HANDLE ERROR HERE
            .finally(stopSpinner);
    };

    var setupPortDataModelStatic = function () {
        var staticProperties = {
            protocolCandidates: getProtocolCandidates(),
            onProtocolChange: onProtocolChange
        };
        staticProperties.selectedProtocol = staticProperties.protocolCandidates[0].key;
        _.extend($scope.dataModel, staticProperties);
        return $q.resolve($scope.dataModel);
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
        $scope.footerModel = portsFooter($scope.dataModel);
        $scope.filterModel = storagePortsService.generateFilterModel($scope.dataModel);
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

    var setupLuns = function (lunsDataModel) {
        objectTransformService.transformDiscoveredLun(lunsDataModel);
        _.extend($scope.dataModel, getLunsDataModel(lunsDataModel));
        $scope.filterModel = undefined;
        $scope.footerModel = lunsFooter($scope.dataModel);
        scrollDataSourceBuilderService.setupDataLoader($scope, lunsDataModel, 'discoveredLunsSearch');
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
            .catch(function(e) {
                console.log('HI THERE!:', e);
            })
            .finally(stopSpinner);
    };

    var getAndSetupHosts = function () {
        return getHosts()
            .then(getHostsModel)
            .then(setupHosts);
    };

    var setupHosts = function (hostsDataModel) {
        _.extend($scope.dataModel, hostsDataModel);
        $scope.footerModel = hostsFooter(hostsDataModel);
        $scope.filterModel = getHostsFilterModel();
        scrollDataSourceBuilderServiceNew.setupDataLoader($scope, hostsDataModel.hosts, 'hostSearch');
        return true;
    };

    var getHosts = function () {
        return paginationService.get(null, 'compute/servers', objectTransformService.transformHost, true);
    };

    var getHostsModel = function (getHostsResult) {
        var dataModel = {
            hosts: getHostsResult.resources,
            nextToken: getHostsResult.nextToken,
            total: getHostsResult.total,
            cachedList: getHostsResult.resources,
            search: {
                freeText: ''
            }
        };
        dataModel.displayList = getHostsResult.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
        dataModel.getResources = function () {
            return paginationService.get(dataModel.nextToken, 'compute/servers', objectTransformService.transformHost, false);
        };
        return dataModel;
    };

    var updateResultTotalCounts = function (result) {
        $scope.dataModel.nextToken = result.nextToken;
        $scope.dataModel.cachedList = result.resources;
        $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
        $scope.dataModel.itemCounts = {
            filtered: $scope.dataModel.displayList.length,
            total: $scope.dataModel.total
        };
    };

    var getHostsFilterModel = function () {
        return {
            filter: {
                freeText: '',
                status: '',
                osType: null,
                replicationType: null,
                snapshot: false,
                clone: false
            },
            filterQuery: function (key, value, type, arrayClearKey) {
                var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                paginationService.setFilterSearch(queryObject);
                paginationService.getQuery('compute/servers', objectTransformService.transformHost).then(function (result) {
                    updateResultTotalCounts(result);
                });
            },
            searchQuery: function (value) {
                var queryObjects = [];
                queryObjects.push(new paginationService.QueryObject('serverId', new paginationService.SearchType().INT, value));
                queryObjects.push(new paginationService.QueryObject('serverName', new paginationService.SearchType().STRING, value));
                paginationService.setTextSearch(queryObjects);
                paginationService.getQuery('compute/servers', objectTransformService.transformHost).then(function (result) {
                    updateResultTotalCounts(result);
                });
            }
        };
    };

    var hostsFooter = function (dataModel) {
        return {
            validation: false,
            canGoNext: function () {
                return _.some(dataModel.displayList, filterSelected);
            },
            next: function () {
                $scope.selected.hosts = _.filter(dataModel.displayList, filterSelected);
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
