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
    previrtualizeService,
    synchronousTranslateService,
    utilService,
    externalVolumesAddService
) {
    // INITIALIZE dataModel
    var initialDataModel = function () {
        var dataModel = {
            isPrevirtualize: true,
            isVirtualizeVolume: true,
            footerModel: footerModel(),
            readyDefer: $q.defer(),
            isWaiting: true,
            onProtocolChange: onProtocolChange,
            onTargetStorageSystemChange: onTargetStorageSystemChange
        };
        return dataModel;
    };

    var footerModel = function () {
        return {
            canSubmit: function () {
                if (
                    $scope.dataModel && $scope.dataModel.pathModel && $scope.dataModel.pathModel.paths
                ) {
                    return attachToStorageService.portsInfo($scope.dataModel.pathModel.paths).length > 0;
                }
                return false;
            },
            submit: submit
        };
    };

    var submit = function () {
        spinner(true);
        var payload = previrtualizeService.createPrevirtualizePayload(
            $scope.dataModel.sourceStorageSystemId,
            $scope.dataModel.selectedTargetStorageSystemId,
            attachToStorageService.portsInfo($scope.dataModel.pathModel.paths),
            $scope.dataModel.selectedVolumeIds
        );
        orchestratorService.previrtualize(payload)
            .then(externalVolumesAddService.backToPreviousView)
            .finally(spinner);
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
        var shareData = extractFromShareDataService();
        if (!shareData) {
            externalVolumesAddService.backToPreviousView();
            return $q.reject();
        }
        _.extend($scope.dataModel, shareData);
        return $q.resolve();
    };

    var initProtocolCandidates = function (sourceStoragePorts) {
        return _.chain(sourceStoragePorts)
            .map(function (p) {
                return p.type;
            })
            .uniq()
            .map(function (type) {
                return {
                    key: type,
                    display: synchronousTranslateService.translate(type)
                };
            })
            .value();
    };

    // FUNCTION DEFINITIONS
    var init = function () {
        initDataModel()
            .then(function () {
                return getInitialData($scope.dataModel.sourceStorageSystemId);
            })
            .then(function (result) {
                _.extend($scope.dataModel, result);
                $scope.dataModel.protocolCandidates = initProtocolCandidates($scope.dataModel.sourceStoragePorts);
                if ($scope.dataModel.protocolCandidates.length) {
                    $scope.dataModel.selectedProtocol = $scope.dataModel.protocolCandidates[0].key;
                }
                var initialTargetStorageSystemId = $scope.dataModel.targetStorageSystemIdCandidates[0];
                $scope.dataModel.selectedTargetStorageSystemId = initialTargetStorageSystemId;
                return $q.resolve(initialTargetStorageSystemId);
            })
            .then(updateTarget)
            .then(buildSvgFn(false))
            .catch(externalVolumesAddService.openErrorDialog)
            .finally(spinner);
    };

    var onTargetStorageSystemChange = function () {
        var currentTargetStorageSystem = $scope.dataModel.selectedTargetStorageSystemId;
        updateTarget(currentTargetStorageSystem)
            .then(buildSvgFn(true))
            .catch(externalVolumesAddService.openErrorDialog);
    };

    var onProtocolChange = function () {
        updateProtocol()
            .then(buildSvgFn(true))
            .catch(externalVolumesAddService.openErrorDialog);
    };

    var updateProtocol = function () {
        deleteLines();
        var targetPorts = filterPorts($scope.dataModel.targetStoragePorts);
        var sourcePorts = filterPorts($scope.dataModel.sourceStoragePorts);
        if (targetPorts.length && sourcePorts.length) {
            $scope.dataModel.pathModel = attachToStorageService.generatePathModel(sourcePorts, targetPorts);
            return $q.resolve();
        } else {
            $scope.dataModel.pathModel = undefined;
            return $q.reject('attach-to-storage-no-ports-message');
        }
    };

    var deleteLines = function () {
        if ($scope.dataModel.deleteAllLines && $scope.dataModel.pathModel) {
            $scope.dataModel.deleteAllLines($scope.dataModel.pathModel);
        }
    };

    var filterPorts = function (ports) {
        return _.filter(ports, function (p) {
            var protocol = $scope.dataModel.selectedProtocol;
            var protocolMatched = p.type === protocol;
            if (protocol === 'FIBRE') {
                return protocolMatched && p.securitySwitchEnabled;
            } else {
                return protocolMatched;
            }
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
            return undefined;
        }
        result.selectedVolumeIds = _.map(result.selectedVolumes, function (v) {
            return v.volumeId;
        });
        return result;
    };

    var updateTarget = function (targetStorageSystemId) {
        deleteLines();
        return getStoragePorts(targetStorageSystemId)
            .then(function (ports) {
                $scope.dataModel.targetStoragePorts =
                    _.chain(ports)
                        .filter(filterTargetStoragePort)
                        .sortBy('storagePortId')
                        .value();
                return $q.resolve();
            }, function () {
                $scope.dataModel.targetStoragePorts = [];
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

    // NOT DEPENDS ON DataModel
    var filterSourceStoragePort = function (port) {
        return !port.isVsmPort &&
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
                .sortBy('storageSystemId')
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
            var ports = _.sortBy(r.resources, 'storagePortId');
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
                return $q.reject('Cannot find available storage.');
            }
            if (!r.sourceStoragePorts.length) {
                return $q.reject('Cannot find available ports.');
            }
            return $q.resolve(r);
        });
    };

    init();
});