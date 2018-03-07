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
 * @name rainierApp.controller:EditLunPathCtrl
 * @description
 * # EditLunPathCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp').controller('EditLunPathCtrl', function (
    $scope, orchestratorService, objectTransformService,
    paginationService, queryService,
    ShareDataService, viewModelService,
    attachVolumeService, constantService
) {

    var GET_PORTS_PATH = 'storage-ports';
    var GET_PORTS_SORT = '?sort=storagePortId:ASC';
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
        paginationService.getAll(null, GET_PORTS_PATH + GET_PORTS_SORT, true, storageSystemId, result.model, $scope.dataModel);
    });

    var dataModel = viewModelService.newWizardViewModel(['attach', 'paths']);

    var storageSystem = {
        storageSystemId: storageSystemId
    };

    _.forEach(selectedVolumes, function(volume){
        volumeIdMap[volume.volumeId] = volume;
    });

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
        var paths = [];
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
           _.forEach(hostGroup.endPoints, function(endPoint){
               if (idCoordinates.hasOwnProperty(endPoint)){
                   // Only store the luns, which contain any selected volumeId, in the path.

                   _.forEach(hostGroup.luns, function(lun){
                       if (volumeIdMap.hasOwnProperty(lun.volumeId)){
                           luns.push();
                       }
                   });

                   var isVsmPort = false;
                   _.forEach($scope.dataModel.storagePorts, function(storagePort){
                       if (storagePort.storagePortId === hostGroup.storagePortId){
                           isVsmPort = storagePort.isVsmPort;
                       }
                   });

                   var path = {
                       storagePortId: hostGroup.storagePortId,
                       serverEndPoint: endPoint,
                       luns: luns,
                       isVsmPort: isVsmPort
                   };
                   paths.push(path);
               }
           });
        });

        return paths;
    }

    angular.extend(dataModel, {
        selectedStorageSystem: storageSystem,
        storageSystems: [storageSystem]
    });

    var setHostModeAndHostModeOptions = function(selectedServers, defaultHostMode) {
        attachVolumeService.registerHostGroupsQuery(queryService, paginationService, selectedServers);
        paginationService.getAllPromises(
            null,
            GET_HOST_GROUPS_PATH,
            false,
            $scope.dataModel.selectedStorageSystem.storageSystemId,
            objectTransformService.transformHostGroups,
            false
        ).then(function(hostGroupResults) {
            var hostGroups = attachVolumeService.getMatchHostGroups(hostGroupResults, selectedServers, volumeIdMap);
            var hostModeOption = attachVolumeService.getMatchedHostModeOption(hostGroups, true);
            var originalAllPaths = getPathsFromHostGroups(hostGroups);
            originalPaths = angular.copy(originalAllPaths);
            $scope.dataModel.attachModel.hostMode = attachVolumeService.getMatchedHostMode(hostGroups, defaultHostMode, true);
            $scope.dataModel.attachModel.originalHostMode = $scope.dataModel.attachModel.hostMode;
            $scope.dataModel.attachModel.lastSelectedHostModeOption = hostModeOption;
            $scope.dataModel.attachModel.selectedHostModeOption = hostModeOption;
            $scope.dataModel.attachModel.orignalSelectedHostModeOption = angular.copy(hostModeOption);
            $scope.dataModel.attachModel.setEnableZoning = function (value) {
                $scope.dataModel.attachModel.enableZoning = value;
            };
            angular.extend($scope.dataModel.pathModel, {
                paths: originalAllPaths,
                originalPathLength: originalPaths.length
            });

        }).finally(function(){
            paginationService.clearQuery();
        });
    };

    dataModel.process = function(resources, token){
        // Only support for fibre port for now
        resources = _.filter(resources, function(storagePort) {
            if (storagePort.isVsmPort) {
                return false;
            }
            return storagePort.type === selectedHosts[0].protocol;
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

    function getPath(path){
        return attachVolumeService.createPath(idCoordinates[path.serverEndPoint].x, idCoordinates[path.serverEndPoint].y,
            idCoordinates[path.storagePortId].x, idCoordinates[path.storagePortId].y);
    }

    function differentPaths(path1, path2) {
        if (path1.serverEndPoint!== path2.serverEndPoint|| path1.storagePortId !== path2.storagePortId){
            return true;
        }

        return false;
    }

    function checkSettingsChange(dataModel) {
        var hostModeOptionMap = {};
        var i;
        if (dataModel.attachModel.originalHostMode !== dataModel.attachModel.hostMode || dataModel.attachModel.enableZoning === true){
            return true;
        }

        if (dataModel.attachModel.selectedHostModeOption.length !== dataModel.attachModel.orignalSelectedHostModeOption.length){
            return true;
        }

        for (i = 0; i<dataModel.attachModel.selectedHostModeOption.length; ++i){
            hostModeOptionMap[dataModel.attachModel.selectedHostModeOption[i]] = true;
        }

        for (i = 0; i<dataModel.attachModel.orignalSelectedHostModeOption.length; ++i){
            if (!hostModeOptionMap.hasOwnProperty(dataModel.attachModel.orignalSelectedHostModeOption[i])){
                return true;
            }
        }

        return false;
    }

    function generatePathPayload (path, host) {
        var serverWwn = host.protocol === 'FIBRE' ? path.serverEndPoint : undefined;
        var iscsiInitiatorName = host.protocol === 'ISCSI' ? path.serverEndPoint : undefined;
        return {
            serverWwn: serverWwn,
            iscsiInitiatorName: iscsiInitiatorName,
            storagePort: path.storagePortId
        };
    }

    function setAllModels() {

        var hostModes = constantService.osType();

        orchestratorService.storageSystemHostModeOptions($scope.dataModel.selectedStorageSystem.storageSystemId).then(function (results) {
            results.shift();
            $scope.dataModel.attachModel = {
                noAvailableArray: false,
                itemSelected: true,
                storageSystemSelectable: false,
                lastSelectedHostModeOption: [],
                selectedVolumes: selectedVolumes,
                selectedServers: selectedHosts,
                storagePorts: dataModel.storagePorts,
                hostModes: hostModes,
                defaultHostMode: hostModes[0],
                hostMode: hostModes[0],
                hostModeOptions: results,
                selectedHostModeOption: [],
                enableZoning: false,
                canGoNext: function () {
                    return true;
                },
                next: function () {
                    if (dataModel.attachModel.canGoNext && !dataModel.attachModel.canGoNext()) {
                        return;
                    }

                    if (originalPaths) {
                        $scope.dataModel.pathModel.paths = angular.copy(originalPaths);
                    }

                    // Update the host mode options before go to next page
                    _.forEach($scope.dataModel.pathModel.selectedHosts, function(host){
                        host.allHostModeOptionsString = attachVolumeService.getAllHostModeOptionsString($scope.dataModel.attachModel.selectedHostModeOption);
                    });

                    $scope.dataModel.selectServerPath = true;
                    dataModel.goNext();
                },
                validation: true
            };

            angular.extend($scope.dataModel.pathModel, {
                selectedVolumes: selectedVolumes,
                selectedHosts: selectedHosts,
                storagePorts: dataModel.storagePorts,
                validation: true,
                withSuggest: false,
                idCoordinates: idCoordinates,
                getPath: getPath,
                createPath: attachVolumeService.createPath,
                previous: function () {
                    dataModel.goBack();
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

                    var settingsChanged = checkSettingsChange($scope.dataModel);
                    var updates = [];
                    var host = $scope.dataModel.pathModel.selectedHosts[0];
                    for (i = 0; i<$scope.dataModel.pathModel.paths.length; ++i){
                        var path = $scope.dataModel.pathModel.paths[i];
                        if(path.isVsmPort){
                            continue;
                        }
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
                                    newPath: generatePathPayload(path, host)
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
                                            currentPath: generatePathPayload(originalPath, host),
                                            newPath: null
                                        };
                                    }
                                } else {
                                    // modify the path, or only have changed autoZone, or hostMode, or hostModeOptions
                                    var lunChange = false;

                                    if (volume.lun !== originalSelectedVolumes[j].lun){
                                        lunChange = true;
                                    }
                                    if (lunChange || differentPaths(originalPath, path) || settingsChanged) {
                                        lunPathDiffPayload = {
                                            storageSystemId: storageSystemId,
                                            volumeId: volume.volumeId,
                                            lun: volume.lun,
                                            currentPath: generatePathPayload(originalPath, host),
                                            newPath: generatePathPayload(path, host)
                                        };
                                    }
                                }
                            }

                            if (lunPathDiffPayload) {
                                updates.push(lunPathDiffPayload);
                            }
                        }

                    }

                    // Currently the api requires the updates to be some value to find the associated host groups to edit.
                    // So if the updates has no value, we don't call the edit-lun-path api.
                    if (updates && updates.length > 0) {
                        var payload = {
                            enableZoning: $scope.dataModel.attachModel.enableZoning,
                            hostMode: $scope.dataModel.attachModel.hostMode,
                            hostModeOptions: $scope.dataModel.attachModel.selectedHostModeOption,
                            updates: updates
                        };

                        orchestratorService.editLunPaths(payload);
                    }
                    window.history.back();
                }
            });
            attachVolumeService.setEndPointCoordinates($scope.dataModel.pathModel.selectedHosts, $scope.dataModel.attachModel.selectedHostModeOption, idCoordinates);
            setHostModeAndHostModeOptions($scope.dataModel.pathModel.selectedHosts, $scope.dataModel.attachModel.defaultHostMode);
            $scope.dataModel.pathModel.viewBoxHeight = attachVolumeService.getViewBoxHeight($scope.dataModel.pathModel.selectedHosts,
                $scope.dataModel.pathModel.storagePorts);
        });

        dataModel.checkSelectedHostModeOptions = function() {
            attachVolumeService.checkSelectedHostModeOptions(dataModel);
        };
    }
});
