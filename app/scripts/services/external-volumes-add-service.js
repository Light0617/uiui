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
    $q, $modal, synchronousTranslateService, storagePortsService, storageSystemCapabilitiesService,
    paginationService, orchestratorService, objectTransformService, scrollDataSourceBuilderServiceNew
) {

    /**
     * COMMON
     */
    var openErrorDialog = function (messageKey) {
        if (!_.isString(messageKey) && messageKey.message) {
            messageKey = messageKey.message;
        }
        var modalInstance = $modal.open({
            templateUrl: 'views/templates/error-modal.html',
            windowClass: 'modal fade confirmation',
            backdropClass: 'modal-backdrop',
            controller: function ($scope) {
                $scope.error = {
                    title: synchronousTranslateService.translate('error-message-title'),
                    message: synchronousTranslateService.translate(messageKey)
                };
                $scope.cancel = function () {
                    modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                };

                modalInstance.result.finally(function () {
                    modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                });
            }
        });
    };

    var openConfirmationDialog = function (message) {
        var defer = $q.defer();
        var modelInstance = $modal.open({
            templateUrl: 'views/templates/basic-confirmation-modal.html',
            windowClass: 'modal fade confirmation',
            backdropClass: 'modal-backdrop',
            controller: function ($scope) {
                $scope.confirmationDialog = 'Warning';
                $scope.confirmationMessage = message;
                $scope.cancel = function () {
                    modelInstance.dismiss('cancel');
                    defer.reject(false);
                };
                $scope.ok = function () {
                    modelInstance.close(true);
                    defer.resolve(true);
                };

                modelInstance.result.finally(function () {
                    $scope.cancel();
                    defer.reject(false);
                });
            }
        });
        return defer.promise;
    };

    var filterSelected = function (i) {
        return i.selected;
    };

    var updateResultTotalCountsFn = function (dataModel) {
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

    var validateGetPortsResult = function (ports) {
        if (ports.length) {
            return ports;
        }
        return $q.reject({ message: 'No available ports for selected protocol.' });
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
            return $q.reject();
        }
        return luns;
    };

    var handleDiscoverError = function () {
        openErrorDialog('Failed to discover LUN from selected port.');
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
        openErrorDialog: openErrorDialog,
        openConfirmationDialog: openConfirmationDialog,
        filterSelected: filterSelected,
        updateResultTotalCountsFn: updateResultTotalCountsFn,
        /** PORTS */
        getProtocolCandidates: getProtocolCandidates,
        getPortsModel: getPortsModel,
        validateGetPortsResult: validateGetPortsResult,
        /** LUNS */
        getLunsDataModel: getLunsDataModel,
        validateGetLunsResult: validateGetLunsResult,
        handleDiscoverError: handleDiscoverError,
        /** SERVERS */
        GET_SERVERS_PATH: GET_SERVERS_PATH,
        getHostsModel: getHostsModel,
        getHostsFilterModel: getHostsFilterModel,
    };
});
