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
 * @name rainierApp.controller:AttachToStorageCtrl
 * @description
 * # AttachToStorageCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp').controller('AttachToStorageCtrl', function (
    $q,
    $scope,
    $routeParams,
    $window,
    ShareDataService,
    paginationService,
    orchestratorService,
    objectTransformService,
    attachToStorageService,
    utilService
) {
    // INITIALIZE dataModel
    var initialDataModel = function () {
        var dataModel = {
            isPrevirtualize: true,
            isVirtualizeVolume: true,
            attachModel: {},
            protocolCandidates: [
                { key: 'FIBRE', display: 'Fibre' },
                { key: 'ISCSI', display: 'iSCSI' }
            ],
            readyDefer: $q.defer(),
            isWaiting: true
        };
        dataModel.selectedProtocol = dataModel.protocolCandidates[0].key;
        return dataModel;
    };

    var spinner = function (waiting) {
        if ($scope.dataModel) {
            $scope.dataModel.isWaiting = waiting;
        }
    };

    var initDataModel = function () {
        $scope.dataModel = initialDataModel();
        $scope.dataModel.isStepActive = function () {
            return true;
        };
        _.extend($scope.dataModel, extractFromShareDataService());
        return $q.resolve();
    };

    // FUNCTION DEFINITIONS
    var init = function () {
        initDataModel()
            .then(function () {
                return getInitialData($scope.dataModel.sourceStorageSystemId);
            })
            .then(function (result) {
                _.extend($scope.dataModel, result);
                var initialTargetStorageSystemId = $scope.dataModel.targetStorageSystemIdCandidates[0];
                $scope.dataModel.selectedTargetStorageSystemId = initialTargetStorageSystemId;
                return $q.resolve(initialTargetStorageSystemId);
            })
            .then(updateTarget)
            .then(buildSvgFn(false))
            .then(function () {
                initFunctions($scope.dataModel);
            })
            .finally(spinner);
    };

    var initFunctions = function (dataModel) {
        dataModel.onTargetStorageSystemChange = onTargetStorageSystemChange;
        dataModel.onProtocolChange = onProtocolChange;
        dataModel.attachModel.submit = submit;
        dataModel.attachModel.canSubmit = canSubmit;
    };

    var submit = function () {
        console.log($scope.dataModel);
    };

    var canSubmit = function () {
        return true;
    };

    var onTargetStorageSystemChange = function () {
        var currentTargetStorageSystem = $scope.dataModel.selectedTargetStorageSystemId;
        updateTarget(currentTargetStorageSystem).then(buildSvgFn(true));
    };

    var onProtocolChange = function () {
        updateProtocol().then(buildSvgFn(true));
    };

    var updateProtocol = function () {
        var targetPorts = filterByProtocol($scope.dataModel.targetStoragePorts);
        var sourcePorts = filterByProtocol($scope.dataModel.sourceStoragePorts);
        console.log(targetPorts);
        if (targetPorts.length && sourcePorts.length) {
            $scope.dataModel.pathModel = attachToStorageService.generatePathModel(sourcePorts, targetPorts);
            return $q.resolve();
        } else {
            $scope.dataModel.pathModel = undefined;
            // TODO SHOW DIALOG
            return $q.reject();
        }
    };

    var filterByProtocol = function (ports) {
        return _.filter(ports, function (p) {
            return p.type === $scope.dataModel.selectedProtocol;
        });
    };

    var extractFromShareDataService = function () {
        var result = {
            sourceStorageSystemId: ShareDataService.pop('sourceStorageSystemId'),
            selectedVolumes: ShareDataService.pop('attachToStorageVolumes')
        };
        if (
            utilService.isNullOrUndef(result.sourceStorageSystemId) ||
            utilService.isNullOrUndef(result.selectedVolumes) ||
            !result.selectedVolumes.length
        ) {
            backToPreviousView();
        }
        return result;
    };

    var updateTarget = function (targetStorageSystemId) {
        if ($scope.dataModel.deleteAllLines && $scope.dataModel.pathModel) {
            $scope.dataModel.deleteAllLines($scope.dataModel.pathModel);
        }
        return getStoragePorts(targetStorageSystemId)
            .then(function (ports) {
                $scope.dataModel.targetStoragePorts =
                    _.chain(ports)
                        .filter(filterTargetStoragePort)
                        .value();
                return $q.resolve();
            })
            .then(updateProtocol);
    };


    var buildSvgFn = function (redrawLines) {
        return function () {
            return $scope.dataModel.readyDefer.promise.then(function () {
                $scope.dataModel.build(redrawLines);
            });
        };
    };

    var backToPreviousView = function () {
        $window.history.back();
    };

    // NOT DEPENDS ON DataModel
    var filterSourceStoragePort = function (port) {
        return !port.isVsmPort &&
            port.securitySwitchEnabled &&
            _.any(port.attributes, function (attr) {
                return attr === 'Target';
            });
    };

    var filterTargetStoragePort = function (port) {
        return !port.isVsmPort &&
            _.any(port.attributes, function (attr) {
                return attr === 'External';
            });
    };

    var getTargetStorageSystemIdCandidates = function (sourceStorageSystemId) {
        return paginationService.getAllPromises(
            null, 'storage-systems', true, null,
            objectTransformService.transformStorageSystem
        ).then(function (storageSystems) {
            var filtered = _.chain(storageSystems)
                .map(function (s) {
                    return s.storageSystemId;
                })
                .filter(function (storageSystemId) {
                    return storageSystemId !== sourceStorageSystemId;
                })
                .value();
            return $q.resolve(filtered);
        });
    };

    var getStoragePorts = function (storageSystemId) {
        return orchestratorService.storagePorts(storageSystemId).then(function (r) {
            var ports = r.resources;
            _.each(ports, function (p) {
                objectTransformService.transformPort(p);
            });
            return $q.resolve(ports);
        });
    };

    var getInitialData = function (sourceStorageSystemId) {
        return $q.all([
            getTargetStorageSystemIdCandidates(sourceStorageSystemId),
            getStoragePorts(sourceStorageSystemId)
        ]).then(function (raw) {
            var filteredSourceStoragePorts = _.filter(raw[1], filterSourceStoragePort);
            var result = {
                targetStorageSystemIdCandidates: raw[0],
                sourceStoragePorts: filteredSourceStoragePorts
            };
            return $q.resolve(result);
        }).then(function (r) {
            if (!r.targetStorageSystemIdCandidates.length) {
                // TODO show dialog for empty storage
            }
            if (!r.sourceStoragePorts.length) {
                // TODO show dialog for empty ports
            }
            return $q.resolve(r);
        });
    };

    init();
});