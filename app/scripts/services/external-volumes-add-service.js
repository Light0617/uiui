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
    $q, $modal, $window, synchronousTranslateService, storagePortsService, storageSystemCapabilitiesService,
    paginationService, orchestratorService, objectTransformService, scrollDataSourceBuilderServiceNew,
    constantService, attachVolumeService, queryService, utilService, errorHandlerService
) {

    /**
     * COMMON
     */
    var backToPreviousView = function () {
        // Timeout is not best way but this is only way to support IE
        // with keeping location context  (from volumes/pools/host).
        // https://stackoverflow.com/a/14992909
        setTimeout(function () {
            $window.history.back();
        }, 100);
    };

    var openErrorDialog = function (messageKey) {
        if (_.isUndefined(messageKey)) {
            return;
        }
        if (!_.isString(messageKey) && messageKey.message) {
            messageKey = messageKey.message;
        } else if (!_.isString(messageKey) && messageKey.data && messageKey.data.message) {
            messageKey = messageKey.data.message;
        }
        errorHandlerService.openErrorDialog(messageKey);
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
        return i.selected && !i.mapped;
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
        // TODO should rewrite with query
        var filtered = _.chain(ports)
            .filter(function (p) {
                return p.attributes.indexOf('External') >= 0;
            }).filter(function (p) {
                return p.type !== 'FIBRE' || (p.type === 'FIBRE' && p.securitySwitchEnabled);
            }).value();

        if (filtered.length) {
            return filtered;
        }
        return $q.reject({message: 'No available ports for selected protocol.'});
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
        var mappedCandidates = ['YES', 'NO'];
        return {
            displayList: luns,
            cachedList: luns,
            vendors: vendors,
            serialNumbers: serialNumbers,
            mappedCandidates: mappedCandidates,
            search: {
                freeText: '',
                vendor: '',
                serialNumber: '',
                mapped: ''
            },
            sort: {}
        };
    };

    var validateGetLunsResult = function (result) {
        if (!utilService.isNullOrUndef(result.resources) && result.resources.length) {
            return result;
        }
        return $q.reject({message: 'There are no available discovered volumes.'});
    };

    var validateMappedLunsResult = function (resources) {
        var anyUnmapped = _.any(resources, function (resource) {
            return !resource.mapped;
        });
        if (anyUnmapped) {
            return resources;
        } else {
            return $q.reject({message: 'There are no available discovered volumes. ' +
                'Please discover external volumes from the storage ports view.'});
        }
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
            return $q.reject({message: 'No available servers for selected protocol.'});
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

        result.checkSelectedHostModeOptions = checkSelectedHostModeOptions;
        result.selectedHostMode = invokeFindHostMode(hosts[0], result.hostModeCandidates);
        result.selectedHostModeOptions = attachVolumeService.getMatchedHostModeOption(hostGroups);
        result.prevSelectedHostModeOptions = result.selectedHostModeOptions;

        var idCoordinates = {};
        attachVolumeService.setPortCoordiantes(result.pathModel.storagePorts, idCoordinates);
        attachVolumeService.setEndPointCoordinates(result.pathModel.selectedHosts, [], idCoordinates);
        result.pathModel.viewBoxHeight = attachVolumeService.getViewBoxHeight(result.pathModel.selectedHosts, ports);
        return result;
    };

    var checkSelectedHostModeOptions = function (dataModel) {
        var before = dataModel.prevSelectedHostModeOptions;
        var after = dataModel.selectedHostModeOptions;

        if (autoAdded(before, after)) {
            deleteExceptAuto(dataModel);
        } else if (exceptAutoAdded(before, after)) {
            deleteAuto(dataModel);
        }
        dataModel.prevSelectedHostModeOptions = dataModel.selectedHostModeOptions;
    };

    var autoAdded = function (before, after) {
        return containsHostModeOptionsAuto(after) &&
            !containsHostModeOptionsAuto(before) &&
            after.length > 1;
    };

    var deleteExceptAuto = function (dataModel) {
        dataModel.selectedHostModeOptions = [999];
    };

    var exceptAutoAdded = function (before, after) {
        return containsHostModeOptionsAuto(before) &&
            containsHostModeOptionsAuto(after) &&
            after.length > 1;
    };

    var deleteAuto = function (dataModel) {
        dataModel.selectedHostModeOptions = _.reject(dataModel.selectedHostModeOptions, function (hmo) {
            return hmo === 999;
        });
    };

    var containsHostModeOptionsAuto = function (selectedHostModeOptions) {
        return _.any(selectedHostModeOptions, function (i) {
            return i === 999;
        });
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
        return $q.reject({message: 'Failed to get available host mode options.'});
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
        return $q.reject({message: 'No available storage ports for selected servers.'});
    };

    return {
        /** COMMON */
        backToPreviousView: backToPreviousView,
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
        validateMappedLunsResult: validateMappedLunsResult,
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
