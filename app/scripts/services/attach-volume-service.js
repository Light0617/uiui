'use strict';

/**
 * @ngdoc service
 * @name rainierApp.attachVolumeService
 * @description
 * # attachVolumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('attachVolumeService', function (
        orchestratorService, viewModelService, resourceTrackerService, constantService,
        ShareDataService, $location, $modal, synchronousTranslateService, editChapService
    ) {
        var autoSelect = 'AUTO';
        var idCoordinates = {};
        var endPointServerIdMap = {};
        var hostModeOptionAutoSelect = 999;
        var noVsmId = synchronousTranslateService.translate('nothing-selected');

        function setPortCoordinates(storagePorts, idCoordinates) {
            _.each(storagePorts, function(port, i){
                var point = {
                    x: 870,
                    y: 10 + i * 25
                };
                storagePorts[i].coordinate = point;
                idCoordinates[storagePorts[i].storagePortId] = point;
            });
        }

        function setSourcePortCoordinates(storagePorts, idCoordinates) {
            _.each(storagePorts, function(port, i){
                var point = {
                    x: 232,
                    y: 10 + i * 25
                };
                storagePorts[i].coordinate = point;
                idCoordinates[storagePorts[i].storagePortId] = point;
            });
        }

        function getAllHostModeOptionsString(hostModeOptions) {
            var allHostModeOptionString = '';
            _.forEach(hostModeOptions, function(hostModeOption) {
                if (hostModeOption === hostModeOptionAutoSelect){
                    return;
                }

                if (allHostModeOptionString !== ''){
                    allHostModeOptionString += ', ';
                }

                allHostModeOptionString += hostModeOption;
            });

            return allHostModeOptionString;
        }

        function setEndPointCoordinate(host, idCoordinates) {
            var endPointCoordinatesMap = {};
            _.forEach(host.endPoints, function(endPoint, i) {
                var point = {
                    x: 232,
                    y: host.startHeight + 13 + i * 25
                };

                idCoordinates[endPoint] = point;
                endPointCoordinatesMap[endPoint] = point;
                endPointServerIdMap[endPoint] = host.serverId;
            });
            host.endPointCoordinatesMap = endPointCoordinatesMap;
        }

        function setEndPointCoordinates(selectedHosts, hostModeOptions, idCoordinates){
            var previousHeight = 0;
            var bufferHeight = 5;
            _.forEach(selectedHosts, function(host){
                host.allHostModeOptionsString = getAllHostModeOptionsString(hostModeOptions);
                host.startHeight = previousHeight;
                previousHeight += ((length && length > 4) ? length* 25 : 100) + bufferHeight;

                host.isSelected = false;

                // Calculate the coordinates of all the endPoint icons of each host so that the html can easily use it.
                _.chain(selectedHosts).forEach(function(h) {return setEndPointCoordinate(h, idCoordinates);});
            });
        }

        function getViewBoxHeight(hosts, storagePorts){
            var lastHost = hosts[hosts.length - 1];
            var hostHeight = lastHost.startHeight + ((lastHost.endPoints.length <= 4) ? 100 : (lastHost.endPoints.length * 25)) + 10;

            if(_.isEmpty(storagePorts)) {
                return hostHeight;
            }

            var portHeight = storagePorts[storagePorts.length - 1].coordinate.y + 30;

            return Math.max(hostHeight, portHeight);
        }

        function updateHostModeOptions(hostModeOptions, dataModel) {
            dataModel.attachModel.selectedHostModeOption = hostModeOptions;
            dataModel.attachModel.lastSelectedHostModeOption = dataModel.attachModel.selectedHostModeOption;
        }

        function difference(array1, array2) {
            if (array1.length > array2) {
                return _.difference(array1, array2)[0];
            } else {
                return _.difference(array2, array1)[0];
            }
        }

        //Function to check if all hostmode options match, if not return default host mode option
        var getMatchedHostModeOption = function(hostGroups, isEditLunPath) {
            var defaultHostModeOption = [999];
            var selectedHostModeOptions = defaultHostModeOption;
            if (hostGroups !== null && hostGroups !== undefined && hostGroups.length > 0) {
                selectedHostModeOptions = hostGroups[0].hostModeOptions;
                for (var i = 1; i < hostGroups.length; i++) {
                    var hostGroup = hostGroups[i];
                    if (hostGroup.hostModeOptions.length !== selectedHostModeOptions.length) {
                        //if edit lun path and the hostmode does not match then return the host mode of the first host mode option
                        return (isEditLunPath === true) && selectedHostModeOptions.length ? selectedHostModeOptions : defaultHostModeOption;
                    } else {
                        for (var j = 0; j < hostGroup.hostModeOptions.length; j++) {
                            if (!isHostModeOptionFound(hostGroup.hostModeOptions[j], selectedHostModeOptions)) {
                                return isEditLunPath === true ? selectedHostModeOptions : defaultHostModeOption;
                            }
                        }
                    }
                }
            }
            return selectedHostModeOptions;
        };

        var setEnableZoningFn = function(servers, attachModel) {
            if (servers[0].protocol === 'FIBRE') {
                attachModel.enableZoning = false;
                return function (value) {
                    attachModel.enableZoning = value;
                };
            } else {
                attachModel.enableZoning = undefined;
                return undefined;
            }
        };

        var isHostModeOptionFound = function(hostModeOption, selectedHostModeOptions) {
            for (var k = 0; k < selectedHostModeOptions.length; k++) {
                if (hostModeOption === selectedHostModeOptions[k]) {
                    return true;
                }
            }
            return false;
        };

        var getSelectedServerWwpns = function(selectedServers) {
            return _.chain(selectedServers)
                .map(function(s) {return s.wwpns;})
                .filter(function(wwns) {return wwns && wwns.length;})
                .flatten()
                .value();
        };

        var getSelectedServerIscsiNames = function(selectedServers) {
            var iscsiNames = _.chain(selectedServers)
                .filter(function (server) {
                    return !_.isEmpty(server.iscsiNames);
                })
                .map(function (server) {
                    return server.iscsiNames;
                }).flatten().value();
            return iscsiNames;
        };

        var registerHostGroupsQuery = function (queryService, paginationService, selectedServers) {
            var iscsiNames = getSelectedServerIscsiNames(selectedServers);
            var wwpns = getSelectedServerWwpns(selectedServers);
            var queryString;
            paginationService.clearQuery();
            if (wwpns.length > 0) {
                queryString = paginationService.getQueryStringForList(wwpns);
                queryService.setQueryMapEntry('hbaWwns', queryString);
            }
            if (iscsiNames.length > 0) {
                queryString = paginationService.getQueryStringForList(iscsiNames);
                queryString = queryService.escapeValue(queryString);
                queryService.setQueryMapEntry('iscsiTargetInformation.iscsiInitiatorNames', queryString);
            }
        };

        var getAllocateLikeFilteredHostGroups = function(servers, hostGroups, hostMode,  hostModeOptions) {
            var endPointToServerMap = {};
            _.forEach(servers, function(server) {
                _.forEach(server.endPoints, function(endPoint) {
                    endPointToServerMap[endPoint] = server;
                });
            });

            var allocateLikeFilteredHostGroups = [];
            var hostGroupIdMap = {};
            _.forEach(hostGroups, function(hostgroup) {
                _.forEach(hostgroup.endPoints, function(endPoint) {
                    var server = endPointToServerMap[endPoint];
                    if (server !== undefined) {
                        // check if host group matches settings
                        // if host mode is auto, host group needs to match server type, else host group needs to match provided host mode
                        if (((hostMode === 'AUTO' && hostgroup.hostMode === server.osType) || hostgroup.hostMode === hostMode) &&
                            (isHostModeOptionsMatch(hostModeOptions, hostgroup.hostModeOptions, hostgroup.hostMode))) {
                            if (!hostGroupIdMap.hasOwnProperty(hostgroup.hostGroupId)) {
                                allocateLikeFilteredHostGroups.push(hostgroup);
                                hostGroupIdMap[hostgroup.hostGroupId] = true;
                            }
                        }
                    }
                });
            });

            return allocateLikeFilteredHostGroups;
        };

        var isHostModeOptionsMatch = function(expectedHostModeOptions, actualHostModeOptions, hostMode) {
            // if host mode options is auto (999) and if host mode matches the default host mode then
            // host mode option needs to match default host mode options for given host mode
            if (_.isEqual(expectedHostModeOptions, [999])) {
                var defaultHostModeOptions = constantService.defaultHostModeWithHostModeOptions[hostMode];
                if (defaultHostModeOptions !== null && defaultHostModeOptions !== undefined && _.isEqual(defaultHostModeOptions, actualHostModeOptions)) {
                    return true;
                }
            // if host mode options not auto (999), then host mode options needs to match provided host mode options
            }else if (_.isEqual(expectedHostModeOptions, actualHostModeOptions)) {
                return true;
            }
            return false;
        };

        var getMatchedHostMode = function(hostGroups, defaultHostMode, isEditLunPath) {
            var selectedHostMode = defaultHostMode;
            if (hostGroups !== null && hostGroups !== undefined && hostGroups.length > 0) {
                selectedHostMode = hostGroups[0].hostMode;
                for (var i = 1; i < hostGroups.length; i++) {
                    if (hostGroups[i].hostMode !== selectedHostMode) {
                        //if edit lun path and the hostmode does not match then return the host mode of the first hos
                        return (isEditLunPath === true) ?  selectedHostMode : defaultHostMode;
                    }
                }

            }
            return selectedHostMode;
        };

        function getPath(path){
            return createPath(idCoordinates[path.serverEndPoint].x, idCoordinates[path.serverEndPoint].y,
                idCoordinates[path.storagePortId].x, idCoordinates[path.storagePortId].y);
        }

        function createPath(x1, y1, x2, y2) {
            var d = 'M ' + x1 + ' ' + y1 + ' ';
            d += 'L ' + (x1 + 50) + ' ' + y1 + ' ';
            d += 'L ' + (x2 - 50) + ' ' + y2 + ' ';
            d += 'L ' + x2 + ' ' + y2 + ' ';

            return d;
        }

        function getPayload(storageSystemId, dataModel, hostModeOptions){
            var i;
            var path;
            var volumes = viewModelService.buildLunResources(dataModel.attachModel.selectedVolumes);
            var ports = [];

            var payload = {
                storageSystemId: storageSystemId,
                hostModeOptions: hostModeOptions,
                volumes: volumes,
                enableZoning: dataModel.attachModel.enableZoning,
                enableLunUnification: dataModel.attachModel.enableLunUnification,
                virtualStorageMachineId: dataModel.vsm === noVsmId ? undefined : dataModel.vsm
            };

            if (dataModel.attachModel.hostMode !== autoSelect) {
                payload.intendedImageType = dataModel.attachModel.hostMode;
            }

            for (i = 0; i < dataModel.pathModel.paths.length; ++i) {
                path = dataModel.pathModel.paths[i];

                // If marked as deleted, it is deleted and should not be added.
                if (path.deleted === true ){
                    continue;
                }

                var protocol = dataModel.pathModel.selectedHosts[0].protocol;
                var serverWwns =  protocol === 'FIBRE' ? [path.serverEndPoint] : undefined;
                var iscsiInitiatorNames = protocol === 'ISCSI' ? [path.serverEndPoint] : undefined;

                ports.push({
                        serverId: endPointServerIdMap[path.serverEndPoint],
                        serverWwns: serverWwns,
                        iscsiInitiatorNames: iscsiInitiatorNames,
                        portIds: [path.storagePortId]
                    }
                );
            }

            payload.ports = ports;

            return payload;
        }

        function getPathsFromHostGroups(hostGroups, storagePorts, idCoordinates){
            var paths = [];
            _.forEach(hostGroups, function(hostGroup){
                _.forEach(hostGroup.endPoints, function(endPoint){
                    if (idCoordinates.hasOwnProperty(endPoint)){
                        var isVsmPort = false;
                        _.forEach(storagePorts, function(storagePort){
                            if (storagePort.storagePortId === hostGroup.storagePortId){
                                isVsmPort = storagePort.vsmPort;
                            }
                        });

                        if (isVsmPort === true) {
                            return;
                        }
                        var path = {
                            storagePortId: hostGroup.storagePortId,
                            serverEndPoint: endPoint
                        };
                        paths.push(path);
                    }
                });
            });

            return paths;
        }

        function getMatchHostGroupsByIscsi(hostGroups, servers, volumeIdMap) {
            var result = [];
            var iscsiNameMap = _.chain(servers)
                .map(function(s) {return s.iscsiNames;})
                .filter(function(iscsis) {return iscsis && iscsis.length;})
                .flatten()
                .indexBy()
                .value();

            _.chain(hostGroups)
                .filter(function (hg) {
                    return hg.iscsiTargetInformation &&
                        hg.iscsiTargetInformation.iscsiInitiatorNames &&
                        hg.iscsiTargetInformation.iscsiInitiatorNames.length;
                })
                .filter(function (hg) {
                    return _.some(
                        hg.iscsiTargetInformation.iscsiInitiatorNames,
                        function(name) {return iscsiNameMap[name];}
                    );
                })
                .filter(function (hg) {
                    return !_.isEmpty(hg.luns);
                })
                .filter(function (hg) {
                    return _.some(hg.luns, function(lun) { return volumeIdMap[lun.volumeId]; });
                })
                .forEach(function (hg) {
                    result.push(hg);
                });

            return result;
        }

        function getMatchHostGroups(hostGroups, servers, volumeIdMap){
            var resultHostGroups = [];
            var serverWwnMap = {};

            _.forEach(servers, function(server){
                _.forEach(server.wwpns, function(wwpn){
                    serverWwnMap[wwpn] = true;
                });

            });

            var foundMatch = _.filter(hostGroups, function(hostGroup){
                var hasWwn = _.some(hostGroup.hbaWwns, function(wwn){ return serverWwnMap.hasOwnProperty(wwn); });
                var hasLun = _.some(hostGroup.luns, function(lun){ return volumeIdMap.hasOwnProperty(lun.volumeId); });
                return hasWwn && hasLun;
            });

            if(foundMatch){
                _.each(foundMatch, function(match){
                    resultHostGroups.push(match);
                });
            }

            resultHostGroups.push(getMatchHostGroupsByIscsi(hostGroups, servers, volumeIdMap));

            return _.flatten(resultHostGroups);
        }

        function filterPorts(ports, selectedHosts) {
            return _.filter(ports, function (p) {return p.type === selectedHosts[0].protocol;}).filter(function(p) {return !p.isVsmPort;});
        }

        var setEditLunPage = function(dataModel, storageSystemId, selectedVolumes, selectedHosts,
                                      hostModeOptions, storagePorts, hostGroups, isCreateAndAttach) {
            storagePorts = filterPorts(storagePorts, selectedHosts);
            idCoordinates = {};
            endPointServerIdMap = {};
            setPortCoordinates(storagePorts, idCoordinates);
            setEndPointCoordinates(selectedHosts, hostModeOptions, idCoordinates);
            var originalAllPaths = getPathsFromHostGroups(hostGroups,storagePorts, idCoordinates);

            dataModel.pathModel = {
                selectedVolumes: selectedVolumes,
                selectedHosts: selectedHosts,
                storagePorts: storagePorts,
                validation: true,
                itemSelected: true,
                withSuggest: true,
                paths: originalAllPaths,
                originalPathLength: originalAllPaths.length,
                idCoordinates: idCoordinates,
                viewBoxHeight: getViewBoxHeight(selectedHosts, storagePorts),
                getPath: getPath,
                createPath: createPath,
                previous: function () {
                    dataModel.goBack();
                }
            };

            if (isCreateAndAttach){
                dataModel.pathModel.canGoNext = function(){
                    return true;
                };
                dataModel.pathModel.next = function() {
                    dataModel.pathModel.attachVolumesToServersPayload = getPayload(storageSystemId, dataModel, hostModeOptions);
                    dataModel.goNext();
                };
            } else {
                dataModel.pathModel.canSubmit = function () {
                    return true;
                };
                dataModel.pathModel.submit = function () {
                    if (!dataModel.canSubmit) {
                        return;
                    }

                    var payload = getPayload(storageSystemId, dataModel, hostModeOptions);

                    // Build reserved resources
                    var reservedResourcesList = [];
                    _.forEach(selectedVolumes, function (vol) {
                        reservedResourcesList.push(vol.volumeId + '=' + resourceTrackerService.volume());
                    });

                    var protocol = dataModel.pathModel.selectedHosts[0].protocol;

                    // Show popup if resource is present in resource tracker else redirect
                    resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId,
                        resourceTrackerService.storageSystem(),
                        'Attach Volumes Confirmation', null, null, payload, protocol === 'ISCSI' ?
                            attachVolumeForIscsi : orchestratorService.attachVolume);
                };
            }
        };

        var invokeServerProtocolCheckAndOpen = function(servers, url) {
            var numOfProtocols = _.chain(servers)
                .map(function(s) {return s.protocol;})
                .indexBy()
                .keys()
                .value()
                .length;

            if(numOfProtocols > 1) {
                openAttachMultipleProtocolServersErrorModal();
                return false;
            } else if(url) {
                ShareDataService.push('selectedServers', servers);
                $location.path(url);
            }
            return true;
        };

        var openAttachMultipleVsmErrorModal = function () {
            var modalInstance = $modal.open({
                templateUrl: 'views/templates/error-modal.html',
                windowClass: 'modal fade confirmation',
                backdropClass: 'modal-backdrop',
                controller: function ($scope) {
                    $scope.error = {
                        title: synchronousTranslateService.translate('error-message-title'),
                        message: synchronousTranslateService.translate('storage-volume-attach-different-vsms')
                    };
                    $scope.cancel = function () {
                        modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    };

                    modalInstance.result.finally(function() {
                        modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    });
                }
            });
        };

        var isMultipleVsm = function (volumes) {
            var vsms = _.chain(volumes)
                .map(function (v) {
                    if(v.virtualStorageMachineInformation) {
                        return v.virtualStorageMachineInformation.virtualStorageMachineId;
                    }
                    return undefined;
                })
                .uniq()
                .value();

            return vsms.length > 1;
        };

        var openAttachMultipleProtocolServersErrorModal = function() {
            var modalInstance = $modal.open({
                templateUrl: 'views/templates/error-modal.html',
                windowClass: 'modal fade confirmation',
                backdropClass: 'modal-backdrop',
                controller: function ($scope) {
                    $scope.error = {
                        title: synchronousTranslateService.translate('error-message-title'),
                        message: synchronousTranslateService.translate('storage-volume-attach-different-protocol-servers')
                    };
                    $scope.cancel = function () {
                        modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    };

                    modalInstance.result.finally(function() {
                        modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    });
                }
            });
        };

        var attachVolumeForIscsi = function (payload) {
            return orchestratorService.attachVolumeForIscsi(payload, function (error, wrapped, defaultErrAction) {
                switch (error.status) {
                    case 412:
                        // Specified CHAP user already exists in the specified Storage Port
                        editChapService.confirmOverwriteChapSecretThenCallApi(
                            error.data.messageParameters, orchestratorService.attachVolume, payload);
                        break;
                    default:
                        defaultErrAction.call({}, error, wrapped);
                }
            }).then(function () {
                window.history.back();
            });
        };

        return {
            checkSelectedHostModeOptions: function (dataModel) {
                var selectedHostModeOptions = dataModel.attachModel.selectedHostModeOption;
                var recentlySelected = difference(dataModel.attachModel.lastSelectedHostModeOption, selectedHostModeOptions);
                if (selectedHostModeOptions.length === 0) {
                    updateHostModeOptions([], dataModel);
                } else if (recentlySelected === 999 || (!_.isNull(selectedHostModeOptions) && !_.isEmpty(selectedHostModeOptions) && selectedHostModeOptions.length === 1 && selectedHostModeOptions[0] === 999)) {
                    updateHostModeOptions([999], dataModel);
                } else {
                    updateHostModeOptions(_.without(selectedHostModeOptions, 999), dataModel);
                }
            },

            // Used to set hostModeOption to empty array for backend API to auto select the options
            getSelectedHostMode: function (dataModel) {
                var selectedHostModeByUser = dataModel.attachModel.selectedHostModeOption;
                if (_.find(selectedHostModeByUser, function (mode) { return mode === 999; })) {
                    return null;
                } else {
                    return _.where(selectedHostModeByUser, function (mode) {
                        return (mode !== 999);
                    });
                }
            },
            getMatchedHostModeOption: getMatchedHostModeOption,
            getSelectedServerWwpns: getSelectedServerWwpns,
            registerHostGroupsQuery: registerHostGroupsQuery,
            getAllocateLikeFilteredHostGroups: getAllocateLikeFilteredHostGroups,
            getMatchedHostMode: getMatchedHostMode,
            setEditLunPage: setEditLunPage,
            getAllHostModeOptionsString: getAllHostModeOptionsString,
            getPath: getPath,
            createPath: createPath,
            getViewBoxHeight: getViewBoxHeight,
            getMatchHostGroups: getMatchHostGroups,
            invokeServerProtocolCheckAndOpen: invokeServerProtocolCheckAndOpen,
            setEnableZoningFn: setEnableZoningFn,
            setEndPointCoordinates: setEndPointCoordinates,
            setPortCoordiantes: setPortCoordinates,
            setSourcePortCoordinates: setSourcePortCoordinates,
            openAttachMultipleVsmErrorModal: openAttachMultipleVsmErrorModal,
            isMultipleVsm: isMultipleVsm,
            noVsmId: noVsmId
        };
    });
