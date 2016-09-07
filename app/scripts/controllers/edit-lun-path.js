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
    var idCoordinates = {};

    var selectedVolumes = ShareDataService.pop('selectedVolumes') || [];
    var selectedHosts = ShareDataService.pop('selectedHost') || null;

    if (!selectedVolumes || selectedVolumes.length === 0 || !selectedHosts) {
        window.history.back();
    }

    var storageSystemId = selectedVolumes[0].storageSystemId;
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
        var paths = [];
        _.forEach(hostGroups, function(hostGroup){
            _.forEach(hostGroup.hbaWwns, function(hbaWwn){
                if (idCoordinates.hasOwnProperty(hbaWwn)){
                    var path = {
                        storagePortId: hostGroup.storagePortId,
                        storageSystemId: hostGroup.storageSystemId,
                        serverWwn: hbaWwn,
                        luns: hostGroup.luns
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
        var length = host.wwpns.length;
        host.allHostModeOptionsString = getAllHostModeOptionsString(selectedVolumes);
        host.startHeight = previousHeight;
        previousHeight += (length && length > 4) ? length* 25 + bufferHeight : 100;

        host.isSelected = false;

        // Calculate the coordinates of all the wwn icons of each host so that the html can easily use it.
        var wwnCoordinates = [];
        for (var j = 0; j < length; ++j) {
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
        paginationService.getAllPromises(null, 'host-groups', false, $scope.dataModel.selectedStorageSystem.storageSystemId, null, false).then(function(hostGroupResults) {
            var hostModeOption = attachVolumeService.getMatchedHostModeOption(hostGroupResults);
            $scope.dataModel.attachModel.hostMode = attachVolumeService.getMatchedHostMode(hostGroupResults, defaultHostMode);
            $scope.dataModel.attachModel.lastSelectedHostModeOption = hostModeOption;
            $scope.dataModel.attachModel.selectedHostModeOption = hostModeOption;
            angular.extend($scope.dataModel.pathModel, {paths: getPathsFromHostGroups(hostGroupResults)});
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
        var d = '';
        d += 'M ' + idCoordinates[path.serverWwn].x + ' ' + idCoordinates[path.serverWwn].y + ' ';
        d += 'L ' + (idCoordinates[path.serverWwn].x + 50) + ' ' + idCoordinates[path.serverWwn].y + ' ';
        d += 'L ' + (idCoordinates[path.storagePortId].x - 50) + ' ' + idCoordinates[path.storagePortId].y + ' ';
        d += 'L ' + idCoordinates[path.storagePortId].x + ' ' + idCoordinates[path.storagePortId].y + ' ';

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
                validation: true,
                previous: function () {
                    dataModel.goBack();
                }
            };
            setHostModeAndHostModeOptions(selectedHosts, dataModel.attachModel.defaultHostMode);
            angular.extend($scope.dataModel.pathModel, {
                selectedVolumes: selectedVolumes,
                selectedHosts: selectedHosts,
                storagePorts: dataModel.storagePorts,
                validation: true,
                getPath: getPath,
                previous: function () {
                    dataModel.goBack();
                },
                toggleSelected: function(item){
                    item.isSelected = !item.isSelected;
                },
                canSubmit: function () {
                    return true;
                },
                submit: function () {
                    if (!$scope.canSubmit) {
                        return;
                    }
                    // To be implemented.
                }
            });
        });

        dataModel.checkSelectedHostModeOptions = function() {
            attachVolumeService.checkSelectedHostModeOptions(dataModel);
        };
    }



});