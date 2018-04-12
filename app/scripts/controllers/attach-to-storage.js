// TODO copyright and ngdoc

'use strict';

angular.module('rainierApp').controller('AttachToStorageCtrl', function (
    $q,
    $scope,
    $routeParams,
    $window,
    ShareDataService,
    paginationService,
    orchestratorService,
    objectTransformService,
    utilService
) {
    // INITIALIZE dataModel
    var initialDataModel = function () {
        var dataModel = {
            attachModel: {
            },
            protocolCandidates: [
                { key: 'FIBRE', display: 'Fibre' },
                { key: 'ISCSI', display: 'iSCSI' }
            ]
        };
        dataModel.selectedProtocol = dataModel.protocolCandidates[0].key;
        return dataModel;
    };

    // FUNCTION DEFINITIONS
    var init = function () {
        var dataModel = initialDataModel();
        _.extend(dataModel, extractFromShareDataService());
        getInitialData(dataModel.sourceStorageSystemId)
            .then(function (result) {
                _.extend(dataModel, result);

                var initialTargetStorageSystemId = dataModel.targetStorageSystemIdCandidates[0];
                dataModel.selectedTargetStorageSystemId = initialTargetStorageSystemId;
                return $q.resolve(initialTargetStorageSystemId);
            })
            .then(updateTarget)
            .catch(backToPreviousView);
        initFunctions(dataModel);

        $scope.dataModel = dataModel;
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
        updateTarget(currentTargetStorageSystem);
    };

    var onProtocolChange = function () {
        // var currentProtocol = $scope.dataModel.selectedProtocol;
    };

    var extractFromShareDataService = function () {
        var result = {
            sourceStorageSystemId: ShareDataService.pop('sourceStorageSystemId'),
            selectedVolumes: ShareDataService.pop('attachToStorageVolumes')
        };
        if (
            utilService.isNullOrUndef(result.sourceStorageSystemId) ||
            utilService.isNullOrUndef(result.volumes) ||
            !result.volumes.length
        ) {
            backToPreviousView();
        }
        return result;
    };

    var updateTarget = function (targetStorageSystemId) {
        return getStoragePorts(targetStorageSystemId)
            .then(function (ports) {
                $scope.dataModel.targetStoragePortCandidates =
                    _.chain(ports).filter(filterTargetStoragePort).value();
            });
    };

    var backToPreviousView = function () {
        // $window.history.back();
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