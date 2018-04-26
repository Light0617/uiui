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
    paginationService, orchestratorService, objectTransformService, scrollDataSourceBuilderServiceNew,
    constantService, attachVolumeService, queryService
) {

    /**
     * COMMON
     */
    var openErrorDialog = function (messageKey) {
        if (_.isUndefined(messageKey)) {
            return;
        }
        if (!_.isString(messageKey) && messageKey.message) {
            messageKey = messageKey.message;
        } else if (!_.isString(messageKey) && messageKey.data && messageKey.data.message) {
            messageKey = messageKey.data.message;
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
                $scope.cancelButtonLabel = 'Cancel';
                $scope.okButtonLabel = 'OK';
                $scope.cancel = function () {
                    modelInstance.dismiss('cancel');
                    defer.reject();
                };
                $scope.ok = function () {
                    modelInstance.close(true);
                    defer.resolve(true);
                };

                modelInstance.result.finally(function () {
                    $scope.cancel();
                    defer.reject();
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

    var setupSelectAllFunctionsFilteredList = function (dataModel) {
        dataModel.isAllSelected = function () {
            return dataModel.filteredList.length && _.every(dataModel.filteredList, filterSelected);
        };
        dataModel.toggleSelectAll = function () {
            if (dataModel.isAllSelected()) {
                _.each(dataModel.filteredList, function (i) {
                    i.selected = false;
                });
            } else {
                _.each(dataModel.filteredList, function (i) {
                    i.selected = !false;
                });
            }
        };
        return dataModel;
    };

    var setupSelectAllFunctionsDisplayList = function (dataModel) {
        dataModel.isAllSelected = function () {
            return dataModel.displayList.length && _.every(dataModel.displayList, filterSelected);
        };
        dataModel.toggleSelectAll = function () {
            if (dataModel.isAllSelected()) {
                _.each(dataModel.displayList, function (i) {
                    i.selected = false;
                });
            } else {
                _.each(dataModel.displayList, function (i) {
                    i.selected = !false;
                });
            }
        };
        return dataModel;
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
            })
            .catch(function () {
                throw new Error('Failed to get storage ports.');
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
        var vendors = _.chain(luns).map(function (l) {
            return l.vendorId;
        }).uniq().value();
        var serialNumbers = _.chain(luns).map(function (l) {
            return l.serialNumber;
        }).uniq().value();
        return {
            displayList: luns,
            cachedList: luns,
            vendors: vendors,
            serialNumbers: serialNumbers,
            search: {
                freeText: '',
                vendor: '',
                serialNumber: ''
            },
            sort: {}
        };
    };

    var validateGetLunsResult = function (luns) {
        if (!luns.length) {
            return $q.reject({ message: 'There are no available luns discovered from selected ports.' });
        }
        return luns;
    };

    /**
     * SERVERS
     */
    var GET_HOSTS_PATH = 'compute/servers';

    var getHosts = function () {
        return paginationService.get(null, GET_HOSTS_PATH, objectTransformService.transformHost, true)
            .catch(function () {
                return $q.reject('Failed to get hosts.');
            });
    };

    var initHostsModel = function (getHostsResult) {
        var dataModel = {
            hosts: getHostsResult.resources,
            nextToken: getHostsResult.nextToken,
            total: getHostsResult.total,
            cachedList: getHostsResult.resources,
            search: {
                freeText: ''
            },
            sort: {}
        };
        dataModel.displayList = getHostsResult.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
        dataModel.getResources = function () {
            return paginationService.get(null, GET_HOSTS_PATH, objectTransformService.transformHost, false);
        };
        return dataModel;
    };

    var getHostsModel = function () {
        return getHosts().then(initHostsModel);
    };

    var getHostsFilterModel = function (dataModel) {
        return {
            showAllFilters: true,
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
                return paginationService.getQuery(GET_HOSTS_PATH, objectTransformService.transformHost).then(function (result) {
                    dataModel.updateResultTotalCounts(result);
                    return true;
                });
            },
            searchQuery: function (value) {
                var queryObjects = [];
                queryObjects.push(new paginationService.QueryObject('serverId', new paginationService.SearchType().INT, value));
                queryObjects.push(new paginationService.QueryObject('serverName', new paginationService.SearchType().STRING, value));
                paginationService.setTextSearch(queryObjects);
                paginationService.getQuery(GET_HOSTS_PATH, objectTransformService.transformHost).then(function (result) {
                    dataModel.updateResultTotalCounts(result);
                });
            }
        };
    };

    var validateGetHostsResult = function (hosts) {
        if (!hosts.length) {
            return $q.reject({ message: 'No available servers for selected protocol.' });
        }
        return hosts;
    };

    var checkSelectedHosts = function (hosts) {
        var protocols = _.chain(hosts)
            .map(function (h) {
                return h.protocol;
            })
            .uniq()
            .value();
        if (protocols.length !== 1) {
            return $q.reject('Cannot virtualize volumes for different protocol servers.');
        }
        return $q.resolve(true);
    };

    /**
     * PATHS
     */
    var getPathsModel = function (storageSystemId, hosts, protocol) {
        return $q.all([
            getHostModeOptions(storageSystemId),
            getHostGroups(storageSystemId),
            getStoragePorts(storageSystemId, protocol)
        ]).then(function (result) {
            var hostModeOptions = result[0];
            var hostGroups = result[1];
            var ports = result[2];
            return initPathsModel(hostModeOptions, hostGroups, ports, hosts);
        });
    };

    var initPathsModel = function (hostModeOptions, hostGroups, ports, hosts) {
        var result = {
            hostModeCandidates: constantService.osType(),
            hostModeOptionCandidates: hostModeOptions,
            selectServerPath: true,
            isVirtualizeVolume: true,
            selectedServer: hosts,
            selectedProtocol: hosts[0].protocol,
            autoCreateZone: false,
            pathModel: {
                selectedHosts: hosts,
                paths: [],
                storagePorts: ports,
                createPath: attachVolumeService.createPath,
            }
        };
        result.selectedHostMode = invokeFindHostMode(hosts[0], result.hostModeCandidates);
        result.selectedHostModeOptions = attachVolumeService.getMatchedHostModeOption(hostGroups);
        var idCoordinates = {};
        attachVolumeService.setPortCoordiantes(result.pathModel.storagePorts, idCoordinates);
        attachVolumeService.setEndPointCoordinates(result.pathModel.selectedHosts, [], idCoordinates);
        result.pathModel.viewBoxHeight = attachVolumeService.getViewBoxHeight(result.pathModel.selectedHosts, ports);
        return result;
    };

    var invokeFindHostMode = function (host, hostModeCandidates) {
        var index = _.indexOf(hostModeCandidates, host.osType);
        index = index === -1 ? 0 : index;
        return hostModeCandidates[index];
    };

    var getHostModeOptions = function (storageSystemId) {
        return orchestratorService.storageSystemHostModeOptions(storageSystemId)
            .then(validateGetHostModeOptionsResult)
            .catch(function () {
                return $q.reject('Failed to get available host mode options.');
            });
    };

    var getHostGroups = function (storageSystemId) {
        return paginationService.getAllPromises(
            null, 'host-groups', false, storageSystemId,
            objectTransformService.transformHostGroups, false
        ).catch(function () {
            return $q.reject('Failed to get host groups');
        });
    };

    var validateGetHostModeOptionsResult = function (result) {
        if (result.length) {
            return result;
        }
        return $q.reject({ message: 'Failed to get available host mode options.' });
    };

    var getStoragePorts = function (storageSystemId, protocol) {
        queryService.clearQueryMap();
        // SHOULD BE TARGET AND NOT VSM
        return paginationService.getAllPromises(
            null, 'storage-ports?q=type:+' + protocol + '+AND+attributes:TARGET_PORT&sort=storagePortId:ASC',
            false, storageSystemId, objectTransformService.transformPort
        )
            .catch(function () {
                // TODO existing bug: paginationSerivce does not throws error when api returns unnormal status
                return $q.reject('Failed to get available storage ports for virtualize.');
            })
            .then(validateGetStoragePortsResult);
    };

    var validateGetStoragePortsResult = function (result) {
        if (result.length) {
            return result;
        }
        return $q.reject({ message: 'No available ports with selected server protocol for virtualize.' });
    };

    return {
        /** COMMON */
        openErrorDialog: openErrorDialog,
        openConfirmationDialog: openConfirmationDialog,
        filterSelected: filterSelected,
        updateResultTotalCountsFn: updateResultTotalCountsFn,
        setupSelectAllFunctionsDisplayList: setupSelectAllFunctionsDisplayList,
        setupSelectAllFunctionsFilteredList: setupSelectAllFunctionsFilteredList,
        /** PORTS */
        getProtocolCandidates: getProtocolCandidates,
        getPortsModel: getPortsModel,
        validateGetPortsResult: validateGetPortsResult,
        /** LUNS */
        getLunsDataModel: getLunsDataModel,
        validateGetLunsResult: validateGetLunsResult,
        /** SERVERS */
        GET_HOSTS_PATH: GET_HOSTS_PATH,
        getHostsModel: getHostsModel,
        getHostsFilterModel: getHostsFilterModel,
        validateGetHostsResult: validateGetHostsResult,
        checkSelectedHosts: checkSelectedHosts,
        /** PATHS */
        getPathsModel: getPathsModel
    };
});
