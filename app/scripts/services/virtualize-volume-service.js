'use strict';

/**
 * @ngdoc service
 * @name rainierApp.virtualizeVolumeService
 * @description
 * # virtualizeVolumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('virtualizeVolumeService', function (
        $location, $modal, ShareDataService, utilService, attachVolumeService, synchronousTranslateService
    ) {

        var remainingPaths = function (paths) {
            return _.filter(paths, function (p) {
                return !p.deleted;
            });
        };

        var createHostModeOptionsPayload = function (selectedHostModeOptions) {
            if (_.any(selectedHostModeOptions, function (i) {
                return i === 999;
            })) {
                return undefined;
            } else {
                return selectedHostModeOptions;
            }
        };

        var constructExternalDevicesPayload = function (luns) {
            return _.map(luns, function (lun) {
                return {
                    externalDeviceId: lun.externalDeviceId
                };
            });
        };

        var constructPortsPayload = function (paths, protocol) {
            return _.map(paths, function (path) {
                return {
                    serverId: parseInt(path.serverId),
                    serverWwns: protocol === 'FIBRE' ? [path.serverEndPoint] : undefined,
                    iscsiInitiatorNames: protocol === 'ISCSI' ? [path.serverEndPoint] : undefined,
                    portIds: [path.storagePortId]
                };
            });
        };

        var constructVirtualizePayload = function (selected) {
            var serverProtocol = selected.hosts[0].protocol;
            return {
                storageSystemId: selected.storageSystem.storageSystemId,
                externalDevices: constructExternalDevicesPayload(selected.luns),
                attachExternalVolumeToServer: {
                    intendedImageType: selected.hostMode,
                    hostModeOptions: createHostModeOptionsPayload(selected.hostModeOptions),
                    enableZoning: selected.autoCreateZone,
                    ports: constructPortsPayload(selected.paths, serverProtocol)
                }
            };
        };

        var extractCommonSourceStorageId = function (volumes) {
            var vols = volumes;
            var sourceStorageSystemIds = _.chain(vols)
                .map(function (v) {
                    return v.storageSystemId;
                })
                .uniq()
                .value();
            if (sourceStorageSystemIds.length === 1) {
                return sourceStorageSystemIds[0];
            } else {
                return undefined;
            }
        };

        var openModalForDifferentStorage = function () {
            var modalInstance = $modal.open({
                templateUrl: 'views/templates/error-modal.html',
                windowClass: 'modal fade confirmation',
                backdropClass: 'modal-backdrop',
                constroller: function ($scope) {
                    $scope.error = {
                        title: synchronousTranslateService.translate('error-message-title'),
                        message: 'Selected volumes comes from different storage systems.'
                    };
                    $scope.cancel = function () {
                        modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    };

                    modalInstance.result.finally(function () {
                        modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    });
                }
            });
        };

        var invokeOpenAttachToStorage = function (volumes) {
            var storageSystemId = extractCommonSourceStorageId(volumes);
            if (utilService.isNullOrUndef(storageSystemId)) {
                openModalForDifferentStorage();
            } else {
                ShareDataService.push('attachToStorageVolumes', volumes);
                ShareDataService.push('sourceStorageSystemId', storageSystemId);
                $location.path(['storage-systems', storageSystemId, 'attach-to-storage'].join('/'));
            }
        };

        return {
            getViewBoxHeight: function (sourcePorts, targetPorts, sourceCoordinates, targetCoordinates) {
                attachVolumeService.setPortCoordiantes(sourcePorts, sourceCoordinates);
                attachVolumeService.setPortCoordiantes(targetPorts, targetCoordinates);

                var sourceHeight = sourcePorts[sourcePorts.length - 1].coordinate.y + 30;

                var targetHeight = targetPorts[targetPorts.length - 1].coordinate.y + 30;

                return Math.max(sourceHeight, targetHeight);
            },
            constructVirtualizePayload: constructVirtualizePayload,
            invokeOpenAttachToStorage: invokeOpenAttachToStorage,
            remainingPaths: remainingPaths
        };
    });