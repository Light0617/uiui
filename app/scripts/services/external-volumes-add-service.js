/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc service
 * @name rainierApp.externalVolumesAddService
 * @description
 * # externalVolumesAddService
 * Factory in the rainierApp.
 */
angular.module('rainierApp').factory('externalVolumesAddService', function (
    $q, synchronousTranslateService, storagePortsService, storageSystemCapabilitiesService,
    paginationService, orchestratorService, objectTransformService, scrollDataSourceBuilderServiceNew
) {

    /**
     * COMMON
     */
    var openWarningDialog = function (/*message*/) {

    };

    var filterSelected = function (i) {
        return i.selected;
    };

    var updateResultTotalCountsFn = function(dataModel) {
        return function (result) {
            dataModel.nextToken = result.nextToken;
            dataModel.cachedList = result.resources;
            dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            dataModel.itemCounts = {
                filtered: dataModel.displayList.length,
                total: dataModel.total
            };
        };
    };

    /**
     * PORTS
     */
    var getProtocolCandidates = function () {
        // TODO get availabe protocol to get ports, if length === 0, show dialog
        return _.map(['FIBRE', 'ISCSI'], function (key) {
            return {
                key: key,
                display: synchronousTranslateService.translate(key)
            };
        });
    };

    var getPortsModel = function (storageSystem, protocol) {
        return storagePortsService.initDataModel(storageSystem.storageSystemId, protocol)
            .then(function (result) {
                result.dataModel.showPortAttributeFilter = storageSystemCapabilitiesService.supportPortAttribute(storageSystem.model.storageSystemModel);
                return result;
            });
    };

    /**
     * LUNS
     */
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

    /**
     * SERVERS
     */
    var GET_SERVERS_PATH = 'compute/servers';

    var getServers = function () {
        return paginationService.get(null, GET_SERVERS_PATH, objectTransformService.transformHost, true);
    };

    var initHostsModel = function (getHostsResult) {
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
            return paginationService.get(dataModel.nextToken, GET_SERVERS_PATH, objectTransformService.transformHost, false);
        };
        return dataModel;
    };

    var getHostsModel = function () {
        return getServers().then(initHostsModel);
    };

    var getHostsFilterModel = function (dataModel) {
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
                paginationService.getQuery(GET_SERVERS_PATH, objectTransformService.transformHost).then(function (result) {
                    dataModel.updateResultTotalCounts(result);
                });
            },
            searchQuery: function (value) {
                var queryObjects = [];
                queryObjects.push(new paginationService.QueryObject('serverId', new paginationService.SearchType().INT, value));
                queryObjects.push(new paginationService.QueryObject('serverName', new paginationService.SearchType().STRING, value));
                paginationService.setTextSearch(queryObjects);
                paginationService.getQuery(GET_SERVERS_PATH, objectTransformService.transformHost).then(function (result) {
                    dataModel.updateResultTotalCounts(result);
                });
            }
        };
    };

    return {
        /** COMMON */
        openWarningDialog: openWarningDialog,
        filterSelected: filterSelected,
        updateResultTotalCountsFn: updateResultTotalCountsFn,
        /** PORTS */
        getProtocolCandidates: getProtocolCandidates,
        getPortsModel: getPortsModel,
        /** LUNS */
        getLunsDataModel: getLunsDataModel,
        validateGetLunsResult: validateGetLunsResult,
        /** SERVERS */
        GET_SERVERS_PATH: GET_SERVERS_PATH,
        getHostsModel: getHostsModel,
        getHostsFilterModel: getHostsFilterModel,
    };
});
