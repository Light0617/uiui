/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2017. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ExternalVolumesAddCtrl
 * @description
 * # ExternalVolumesAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp').controller('ExternalVolumesAddCtrl', function (
    $q, $scope, $window, $routeParams, externalVolumesAddService, utilService, viewModelService,
    storagePortsService, orchestratorService, objectTransformService, storageSystemCapabilitiesService,
    scrollDataSourceBuilderServiceNew, paginationService
) {
    var backToPreviousView = function () {
        $window.history.back();
    };

    var init = function () {
        $scope.dataModel = viewModelService.newWizardViewModel([
            'selectPorts', 'selectEndPoints', 'selectLuns', 'selectServers', 'selectPaths'
        ]);
        var storageSystemId = extractStorageSystemId();
        var dataModel = {
            storageSystemId: storageSystemId,
            portPage: {
                dataModel: {
                    id: 'dm'
                },
                filterModel: {
                    id: 'fm'
                }
            }
        };
        _.extend($scope.dataModel, dataModel);

        orchestratorService.storageSystem(storageSystemId)
            .then(function (storage) {
                dataModel.storageSystemModel = storage.model;
                return storagePortsService.initFibreDataModel(storageSystemId);
            })
            .then(function (result) {
                var portDataModel = {};
                portDataModel = result.dataModel;
                portDataModel.showPortAttributeFilter = storageSystemCapabilitiesService.supportPortAttribute(dataModel.storageSystemModel);
                portDataModel.filterModel = storagePortsService.generateDataModel(portDataModel);
                dataModel.portPage.dataModel = portDataModel;
                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.ports, 'storagePortSearch', true);
            });

        /*
        getStorage(dataModel.storageSystemId)
            .then(function (storageSystemModel) {
                dataModel.storageSystemModel = storageSystemModel;
                return dataModel.storageSystemId;
            })
            .then(availableProtocols)
            .then(function (protocols) {
                dataModel.availableProtocols = protocols;
                dataModel.selectedProtocol = dataModel.availableProtocols[0];
                return dataModel.selectedProtocol;
            })
            .then(function (protocol) {
                // if (protocol === 'FIBRE') {
                return initFibre(dataModel.storageSystemId, dataModel.storageSystemModel, dataModel);
                // }
            })
            .then(function (result) {
                _.extend(dataModel, result.dataModel);
                _.extend($scope.dataModel, dataModel);
                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.ports, 'storagePortSearch', true);
            });
         */
    };

    /*
    var availableProtocols = function (storageSystemId) {
        return orchestratorService.storagePorts(storageSystemId).then(function (ports) {
            var protocols = _.chain(ports.resources)
                .map(function (p) {
                    return p.type;
                })
                .uniq()
                .value();
            return protocols;
        });
    };

    var getStorage = function (storageSystemId) {
        return orchestratorService.storageSystem(storageSystemId)
            .then(function (result) {
                objectTransformService.transformStorageSystem(result);
                return result;
            });
    };

    var initFibre = function (storageSystemId, storageSystemModel, dataModel) {
        return storagePortsService.initFibreDataModel(storageSystemId)
            .then(function (result) {
                _.extend(dataModel, result.dataModel);
                dataModel.gridSettings = storagePortsService.fibreGridSettings(storageSystemModel);
                dataModel.showPortAttributeFilter = storageSystemCapabilitiesService.supportPortAttribute(storageSystemModel);
                dataModel.filterModel = storagePortsService.generateFilterModel(dataModel);
                return {
                    dataModel: dataModel,
                    ports: result.ports
                };
            });
    };
    */

    var extractStorageSystemId = function () {
        var result = $routeParams.storageSystemId;
        if (utilService.isNullOrUndef(result)) {
            backToPreviousView();
        }
        return result;
    };

    init();
});
