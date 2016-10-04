'use strict';

/**
 * @ngdoc service
 * @name rainierApp.attachVolumeService
 * @description
 * # attachVolumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('attachVolumeService', function (orchestratorService, viewModelService, resourceTrackerService, constantService) {
        var autoSelect = 'AUTO';
        var idCoordinates = {};
        var wwpnServerIdMap = {};
        var hostModeOptionAutoSelect = 999;

        function setPortCoordinates(storagePorts, idCoordinates) {
            for (var i =0; i< storagePorts.length; ++i){
                var point = {
                    x: 870,
                    y: 10 + i * 25
                };
                storagePorts[i].coordinate = point;
                idCoordinates[storagePorts[i].storagePortId] = point;
            }
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

        function setWwnCoordinates(selectedHosts, hostModeOptions, idCoordinates){
            var previousHeight = 0;
            var bufferHeight = 5;
            _.forEach(selectedHosts, function(host){
                var j;
                var wwpn;
                var wwnCoordinates = [];
                var length = host.wwpns.length;

                host.allHostModeOptionsString = getAllHostModeOptionsString(hostModeOptions);
                host.startHeight = previousHeight;
                previousHeight += ((length && length > 4) ? length* 25 : 100) + bufferHeight;

                host.isSelected = false;

                // Calculate the coordinates of all the wwn icons of each host so that the html can easily use it.

                for (j = 0; j < length; ++j) {
                    wwpn = host.wwpns[j];
                    var point = {
                        x: 232,
                        y: host.startHeight + 13 + j*25
                    };

                    idCoordinates[wwpn] = point;
                    wwnCoordinates.push(point);

                    wwpnServerIdMap[wwpn] = host.serverId;
                }
                host.wwnCoordinates = wwnCoordinates;


            });
        }

        function getViewBoxHeight(hosts, storagePorts){
            var lastHost = hosts[hosts.length - 1];
            var hostHeight = lastHost.startHeight + ((lastHost.wwpns.length <= 4) ? 100 : (lastHost.wwpns.length * 25)) + 10;
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
        var getMatchedHostModeOption = function(hostGroups) {
            var defaultHostModeOption = [999];
            var selectedHostModeOptions = defaultHostModeOption;
            if (hostGroups !== null && hostGroups !== undefined && hostGroups.length > 0) {
                selectedHostModeOptions = hostGroups[0].hostModeOptions;
                for (var i = 1; i < hostGroups.length; i++) {
                    var hostGroup = hostGroups[i];
                    if (hostGroup.hostModeOptions.length !== selectedHostModeOptions.length) {
                        return defaultHostModeOption;
                    } else {
                        for (var j = 0; j < hostGroup.hostModeOptions.length; j++) {
                            if (!isHostModeOptionFound(hostGroup.hostModeOptions[j], selectedHostModeOptions)) {
                                return defaultHostModeOption;
                            }
                        }
                    }
                }
            }
            return selectedHostModeOptions;
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
            var serverWwpns = [];
            if (selectedServers !== null && selectedServers !== undefined) {
                for (var i = 0; i < selectedServers.length; i++) {
                    var selectedServer = selectedServers[i];
                    for (var j = 0; j < selectedServer.wwpns.length; j++) {
                        serverWwpns.push(selectedServer.wwpns[j]);
                    }
                }
            }
            return serverWwpns;
        };

        var getAllocateLikeFilteredHostGroups = function(servers, hostGroups, hostMode,  hostModeOptions) {
            var wwpnToServerMap = {};
            _.forEach(servers, function(server) {
                _.forEach(server.wwpns, function(wwpn) {
                    wwpnToServerMap[wwpn] = server;
                });
            });

            var allocateLikeFilteredHostGroups = [];
            _.forEach(hostGroups, function(hostgroup) {
                _.forEach(hostgroup.hbaWwns, function(hbaWwn) {
                    var server = wwpnToServerMap[hbaWwn];
                    if (server !== undefined) {
                        // check if host group matches settings
                        // if host mode is auto, host group needs to match server type, else host group needs to match provided host mode
                        if (((hostMode === 'AUTO' && hostgroup.hostMode === server.osType) || hostgroup.hostMode === hostMode) &&
                            (isHostModeOptionsMatch(hostModeOptions, hostgroup.hostModeOptions, hostgroup.hostMode))) {
                            allocateLikeFilteredHostGroups.push(hostgroup);
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

        var getMatchedHostMode = function(hostGroups, autoSelectHostMode) {
            var selectedHostMode = autoSelectHostMode;
            if (hostGroups !== null && hostGroups !== undefined && hostGroups.length > 0) {
                selectedHostMode = hostGroups[0].hostMode;
                for (var i = 1; i < hostGroups.length; i++) {
                    if (hostGroups[i].hostMode !== selectedHostMode) {
                        //if the hostmode does not match then use auto select
                        return autoSelectHostMode;
                    }
                }

            }
            return selectedHostMode;
        };

        function getPath(path){
            return createPath(idCoordinates[path.serverWwn].x, idCoordinates[path.serverWwn].y,
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
                enableLunUnification: dataModel.attachModel.enableLunUnification
            };

            if (dataModel.attachModel.hostMode !== autoSelect) {
                payload.intendedImageType = dataModel.attachModel.hostMode;
            }

            for (i = 0; i < dataModel.pathModel.paths.length; ++i) {
                path = dataModel.pathModel.paths[i];

                // If marked as deleted, it is deleted and should not be added.
                if (path.deleted === true){
                    continue;
                }

                ports.push({
                        serverId: wwpnServerIdMap[path.serverWwn],
                        serverWwns: [path.serverWwn],
                        portIds: [path.storagePortId]
                    }
                );
            }

            payload.ports = ports;

            return payload;
        }

        function getPathsFromHostGroups(hostGroups, idCoordinates){
            var paths = [];
            _.forEach(hostGroups, function(hostGroup){
                _.forEach(hostGroup.hbaWwns, function(hbaWwn){
                    if (idCoordinates.hasOwnProperty(hbaWwn)){
                        var path = {
                            storagePortId: hostGroup.storagePortId,
                            serverWwn: hbaWwn
                        };
                        paths.push(path);
                    }
                });
            });

            return paths;
        }

        function getMatchHostGroups(hostGroups, servers, volumeIdMap){
            var resultHostGroups = [];
            var serverWwnMap = {};
            var i;
            var j;
            var foundMatch;

            _.forEach(servers, function(server){
                _.forEach(server.wwpns, function(wwpn){
                    serverWwnMap[wwpn] = true;
                });

            });

            _.forEach(hostGroups, function(hostGroup) {
                for (i = 0; i < hostGroup.hbaWwns.length; ++i) {
                    if (serverWwnMap.hasOwnProperty(hostGroup.hbaWwns[i])) {
                        foundMatch = false;
                        for (j = 0; j < hostGroup.luns.length; ++j) {
                            if (volumeIdMap.hasOwnProperty(hostGroup.luns[j].volumeId)) {
                                resultHostGroups.push(hostGroup);
                                foundMatch = true;
                                break;
                            }
                        }
                        if (foundMatch) {
                            break;
                        }

                    }
                }
            });

            return resultHostGroups;
        }

        var setEditLunPage = function(dataModel, storageSystemId, selectedVolumes, selectedHosts,
                                      hostModeOptions, storagePorts, hostGroups, isCreateAndAttach) {
            idCoordinates = {};
            wwpnServerIdMap = {};
            setPortCoordinates(storagePorts, idCoordinates);
            setWwnCoordinates(selectedHosts, hostModeOptions, idCoordinates);
            var originalAllPaths = getPathsFromHostGroups(hostGroups, idCoordinates);

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

                    // Show popup if resource is present in resource tracker else redirect
                    resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                        'Attach Volumes Confirmation', null, null, payload, orchestratorService.attachVolume);

                };
            }
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
            getAllocateLikeFilteredHostGroups: getAllocateLikeFilteredHostGroups,
            getMatchedHostMode: getMatchedHostMode,
            setEditLunPage: setEditLunPage,
            setWwnCoordinates: setWwnCoordinates,
            getAllHostModeOptionsString: getAllHostModeOptionsString,
            createPath: createPath,
            getViewBoxHeight: getViewBoxHeight,
            getMatchHostGroups: getMatchHostGroups
        };
    });