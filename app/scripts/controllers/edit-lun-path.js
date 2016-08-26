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

    var selectedVolumes = ShareDataService.pop('selectedVolumes') || [];
    var selectedHost = ShareDataService.pop('selectedHost') || null;

    if (!selectedVolumes || selectedVolumes.length === 0 || !selectedHost) {
        window.history.back();
    }

    var storageSystemId = selectedVolumes[0].storageSystemId;

    $scope.operatingSystemType = {};
    $scope.operatingSystems = constantService.osType();


    orchestratorService.storageSystem(storageSystemId).then(function(result) {
        $scope.dataModel.storageSystemModel = result.model;
        paginationService.getAll(null, GET_PORTS_PATH, true, storageSystemId, result.model, $scope.dataModel);
    });

    var dataModel = viewModelService.newWizardViewModel(['attach', 'path']);

    var storageSystem = {
        storageSystemId: storageSystemId
    };

    angular.extend(dataModel, {
        selectedStorageSystem: {
            storageSystemId: storageSystemId
        },
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
        }).finally(function(){
            paginationService.clearQuery();
        });
    };

    dataModel.process = function(resources){
        // Only support for fibre port for now
        resources = _.filter(resources, function(storagePort) {
            return storagePort.type === 'FIBRE';
        });
        _.forEach(resources, function (item) {
            item.storageSystemModel = dataModel.storageSystemModel;
            objectTransformService.transformPort(item);
        });

        dataModel.storagePorts = dataModel.storagePorts.concat(resources);
    };
    dataModel.storagePorts = [];

    $scope.dataModel = dataModel;

    var autoSelect = 'AUTO';

    $scope.$watch('dataModel.storagePorts', function (ports) {
        if (!ports) {
            return;
        }

        var hostModes = constantService.osType();
        hostModes.splice(0, 0, autoSelect);

        orchestratorService.storageSystemHostModeOptions($scope.dataModel.selectedStorageSystem.storageSystemId).then(function (results) {
            $scope.dataModel.attachModel = {
                noAvailableArray: false,
                itemSelected: true,
                storageSystemSelectable: false,
                lastSelectedHostModeOption: [999],
                selectedVolumes: selectedVolumes,
                selectedServers: [selectedHost],
                serverPortMapperModel: viewModelService.newServerPortMapperModel(ports, [selectedHost]),
                storagePorts: ports,
                hostModes: hostModes,
                defaultHostMode: hostModes[0],
                hostMode: hostModes[0],
                hostModeOptions: results,
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
                    var selectedServers = _.where(dataModel.displayList, 'selected');
                    dataModel.attachModel.serverPortMapperModel = viewModelService.newServerPortMapperModel(dataModel.attachModel.storagePorts, selectedServers);
                    setHostModeAndHostModeOptions(selectedServers, dataModel.attachModel.defaultHostMode);
                    dataModel.goNext();
                },
                validation: true,
                previous: function () {
                    dataModel.goBack();
                }

            };
        });
        dataModel.checkSelectedHostModeOptions = function() {
            attachVolumeService.checkSelectedHostModeOptions(dataModel);
        };
    });

});
