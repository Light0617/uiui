/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2016. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:EditLunPathCtrl
 * @description
 * # EditLunPathCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp').controller('EditLunPathCtrl', function ($scope, orchestratorService, objectTransformService,
                                                                     paginationService, queryService,
                                                                     ShareDataService, viewModelService,
                                                                     attachVolumeService, constantService) {

    var GET_PORTS_PATH = 'storage-ports';
    var GET_HOST_GROUPS_PATH = 'host-groups';
    var idCoordinates = {};
    var volumeIdMap = {};
    var originalPaths;

    var selectedVolumes = ShareDataService.pop('selectedVolumes') || [];
    var selectedHosts = ShareDataService.pop('selectedHost') || null;

    if (!selectedVolumes || selectedVolumes.length === 0 || !selectedHosts) {
        window.history.back();
    }

    var storageSystemId = selectedVolumes[0].storageSystemId;
    var originalSelectedVolumes = angular.copy(selectedVolumes);

    $scope.canSubmit = true;
    $scope.operatingSystemType = {};
    $scope.operatingSystems = constantService.osType();

    orchestratorService.storageSystem(storageSystemId).then(function(result) {
        $scope.dataModel.storageSystemModel = result.model;
        paginationService.getAll(null, GET_PORTS_PATH, true, storageSystemId, result.model, $scope.dataModel);
    });

    var dataModel = viewModelService.newWizardViewModel(['attach', 'paths']);

    var storageSystem = {
        storageSystemId: storageSystemId
    };

    _.forEach(selectedVolumes, function(volume){
        volumeIdMap[volume.volumeId] = volume;
    });

    function getAllHostModeOptionsString(volumes){
        var hostModeOptionSet = {};
        _.forEach(volumes, function(volume){
            _.forEach(volume.paths, function(path){
                _.forEach(path.hostModeOptions, function(hostModeOption){
                    if(!hostModeOptionSet.hasOwnProperty(hostModeOption)){
                        hostModeOptionSet[hostModeOption] = true;
                    }
                });
            });
        });

        var allHostModeOptionString = '';
        for (var property in hostModeOptionSet){
            if (hostModeOptionSet.hasOwnProperty(property)){
                if (allHostModeOptionString !== ''){
                    allHostModeOptionString += ', ';
                }

                allHostModeOptionString += property;
            }
        }

        return allHostModeOptionString;
    }

    function setPortCoordinates(storagePorts) {
        for (var i =0; i< storagePorts.length; ++i){
            var point = {
                x: 870,
                y: 10 + i * 25
            };
            storagePorts[i].coordinate = point;
            idCoordinates[storagePorts[i].storagePortId] = point;
        }
    }

    function getPathsFromHostGroups(hostGroups){
        var paths;
        _.forEach(hostGroups, function(hostGroup){
            var i;
            var foundLun = false;

            var luns = [];
            for(i = 0; i< hostGroup.luns.length; ++i) {
                if (volumeIdMap.hasOwnProperty(hostGroup.luns[i].volumeId)){
                    foundLun = true;
                    break;
                }
            }
            if (foundLun === false) {
                return;
            }
           _.forEach(hostGroup.hbaWwns, function(hbaWwn){
               if (idCoordinates.hasOwnProperty(hbaWwn)){
                   // Only store the luns, which contain any selected volumeId, in the path.
                   paths = [];
                   _.forEach(hostGroup.luns, function(lun){
                       if (volumeIdMap.hasOwnProperty(lun.volumeId)){
                           luns.push();
                       }
                   });

                   var path = {
                       storagePortId: hostGroup.storagePortId,
                       serverWwn: hbaWwn,
                       luns: luns
                   };
                   paths.push(path);
               }
           });
        });

        return paths;
    }

    var previousHeight = 0;
    var bufferHeight = 5;
    _.forEach(selectedHosts, function(host){
        var j;
        var wwnCoordinates = [];
        var length = host.wwpns.length;
        host.allHostModeOptionsString = getAllHostModeOptionsString(selectedVolumes);
        host.startHeight = previousHeight;
        previousHeight += (length && length > 4) ? length* 25 + bufferHeight : 100;

        host.isSelected = false;

        // Calculate the coordinates of all the wwn icons of each host so that the html can easily use it.

        for (j = 0; j < length; ++j) {
            var point = {
                x: 232,
                y: host.startHeight + 13 + j*25
            };

            idCoordinates[host.wwpns[j]] = point;
            wwnCoordinates.push(point);
        }
        host.wwnCoordinates = wwnCoordinates;
    });

    angular.extend(dataModel, {
        selectedStorageSystem: storageSystem,
        storageSystems: [storageSystem]
    });

    var setHostModeAndHostModeOptions = function(selectedServers, defaultHostMode) {
        var wwpns = attachVolumeService.getSelectedServerWwpns(selectedServers);
        var queryString = paginationService.getQueryStringForList(wwpns);
        paginationService.clearQuery();
        queryService.setQueryMapEntry('hbaWwns', queryString);
        paginationService.getAllPromises(null, GET_HOST_GROUPS_PATH, false, $scope.dataModel.selectedStorageSystem.storageSystemId, null, false).then(function(hostGroupResults) {
            var hostModeOption = attachVolumeService.getMatchedHostModeOption(hostGroupResults);
            var originalAllPaths = getPathsFromHostGroups(hostGroupResults);
            $scope.dataModel.attachModel.hostMode = attachVolumeService.getMatchedHostMode(hostGroupResults, defaultHostMode);
            $scope.dataModel.attachModel.lastSelectedHostModeOption = hostModeOption;
            $scope.dataModel.attachModel.selectedHostModeOption = hostModeOption;
            angular.extend($scope.dataModel.pathModel, {
                paths: originalAllPaths,
                originalPathLength: originalAllPaths.length
            });
            originalPaths = angular.copy(originalAllPaths);
        }).finally(function(){
            paginationService.clearQuery();
        });
    };

    dataModel.process = function(resources, token){
        // Only support for fibre port for now
        resources = _.filter(resources, function(storagePort) {
            return storagePort.type === 'FIBRE';
        });
        _.forEach(resources, function (item) {
            item.storageSystemModel = dataModel.storageSystemModel;
            item.isSelected = false;
            objectTransformService.transformPort(item);
        });

        dataModel.storagePorts = dataModel.storagePorts.concat(resources);

        if (token === null){
            setPortCoordinates(dataModel.storagePorts);
            setAllModels();
        }
    };
    dataModel.storagePorts = [];
    dataModel.pathModel = {};

    $scope.dataModel = dataModel;

    var autoSelect = 'AUTO';

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

    function setAllModels() {

        var hostModes = constantService.osType();
        hostModes.splice(0, 0, autoSelect);

        orchestratorService.storageSystemHostModeOptions($scope.dataModel.selectedStorageSystem.storageSystemId).then(function (results) {
            $scope.dataModel.attachModel = {
                noAvailableArray: false,
                itemSelected: true,
                storageSystemSelectable: false,
                lastSelectedHostModeOption: [999],
                selectedVolumes: selectedVolumes,
                selectedServers: selectedHosts,
                storagePorts: dataModel.storagePorts,
                hostModes: hostModes,
                defaultHostMode: hostModes[0],
                hostMode: hostModes[0],
                hostModeOptions: results,
                serverPortMapperModel: viewModelService.newServerPortMapperModel(dataModel.storagePorts, selectedHosts),
                selectedHostModeOption: [999],
                enableZoning: false,
                enableLunUnification: false,
                canGoNext: function () {
                    return true;
                },
                next: function () {
                    if (dataModel.attachModel.canGoNext && !dataModel.attachModel.canGoNext()) {
                        return;
                    }

                    dataModel.goNext();
                },
                validation: true
            };
            setHostModeAndHostModeOptions(selectedHosts, dataModel.attachModel.defaultHostMode);
            angular.extend($scope.dataModel.pathModel, {
                selectedVolumes: selectedVolumes,
                selectedHosts: selectedHosts,
                storagePorts: dataModel.storagePorts,
                validation: true,
                getPath: getPath,
                createPath: createPath,
                previous: function () {
                    dataModel.goBack();
                },
                toggleSelected: function(item, event) {
                    item.isSelected = !item.isSelected;
                    if (event) {
                        event.stopPropagation();
                    }
                },
                canSubmit: function () {
                    return true;
                },
                submit: function () {
                    var i;
                    var j;
                    if (!$scope.canSubmit) {
                        return;
                    }

                    var updates = [];
                    for (i = 0; i<$scope.dataModel.pathModel.paths.length; ++i){
                        var path = $scope.dataModel.pathModel.paths[i];

                        for(j = 0; j<selectedVolumes.length; ++j){

                            var lunPathDiffPayload = null;
                            var volume = selectedVolumes[j];
                            // Add new path
                            if (!path.luns){
                                lunPathDiffPayload = {
                                    storageSystemId: storageSystemId,
                                    volumeId: volume.volumeId,
                                    lun: volume.lun,
                                    currentPath: null,
                                    newPath: {
                                        serverWwn: path.serverWwn,
                                        storagePort: path.storagePortId
                                    }
                                };
                            } else {
                                var originalPath = originalPaths[i];
                                if (path.deleted === true) {
                                    // When path.luns is not set, it means that the path is newly added.
                                    // Deleting a newly added path means no-op.
                                    if (path.luns) {
                                        // Delete the path
                                        lunPathDiffPayload = {
                                            storageSystemId: storageSystemId,
                                            volumeId: volume.volumeId,
                                            lun: volume.lun,
                                            currentPath: {
                                                serverWwn: originalPath.serverWwn,
                                                storagePort: originalPath.storagePortId
                                            },
                                            newPath: null
                                        };
                                    }
                                } else {
                                    // modify the path
                                    var pathChanged = false;
                                    var lunChange = false;
                                    if (originalPath.serverWwn !== path.serverWwn && originalPath.storagePortId !== path.storagePortId){
                                        pathChanged = true;
                                    }
                                    if (volume.lun !== originalSelectedVolumes[j].lun){
                                        lunChange = true;
                                    }
                                    if (pathChanged || lunChange) {
                                        lunPathDiffPayload = {
                                            storageSystemId: storageSystemId,
                                            volumeId: volume.volumeId,
                                            lun: volume.lun,
                                            currentPath: {
                                                serverWwn: originalPath.serverWwn,
                                                storagePort: originalPath.storagePortId
                                            },
                                            newPath: pathChanged !== true ? null :
                                                {
                                                    serverWwn: path.serverWwn,
                                                    storagePort: path.storagePortId
                                                }
                                        };
                                    }
                                }
                            }

                            if (lunPathDiffPayload) {
                                updates.push(lunPathDiffPayload);
                            }
                        }

                    }

                    var payload = {
                        enableZoning: $scope.dataModel.attachModel.enableZoning,
                        hostMode: $scope.dataModel.attachModel.hostMode,
                        hostModeOptions: $scope.dataModel.attachModel.selectedHostModeOption,
                        updates: updates
                    };

                    orchestratorService.editLunPaths(payload);
                    window.history.back();
                }
            });
        });

        dataModel.checkSelectedHostModeOptions = function() {
            attachVolumeService.checkSelectedHostModeOptions(dataModel);
        };
    }



});
