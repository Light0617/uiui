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

        var constructVirtualizePayload = function (selected) {
            var serverMap = new Map();
            var serverProtocol = selected.hosts[0].protocol;
            var payload = {
                targetPorts: [],
                serverInfos: [],
                externalLuns: [],
                storageSystemId: selected.storageSystem.storageSystemId,
                enableZoning: selected.autoCreateZone,
                hostMode: selected.hostMode,
                hostModeOptions: createHostModeOptionsPayload(selected.hostModeOptions)
            };
            _.each(selected.externalPorts, function (port) {
                payload.targetPorts.push(port.storagePortId);
            });
            _.each(remainingPaths(selected.paths), function (path) {
                var key = path.storagePortId + path.serverId;
                var serverInfo = {
                    targetPortForHost: path.storagePortId,
                    serverId: parseInt(path.serverId),
                    serverWwns: serverProtocol === 'FIBRE' ? [path.serverEndPoint] : undefined,
                    iscsiInitiatorNames: serverProtocol === 'ISCSI' ? [path.serverEndPoint] : undefined
                };
                serverInfo.protocol = serverProtocol;
                if (!serverMap.has(key)) {
                    serverMap.set(key, serverInfo);
                } else if(serverMap.get(key).serverWwns) {
                    serverMap.get(key).serverWwns.push(path.serverEndPoint);
                } else if(serverMap.get(key).iscsiInitiatorNames) {
                    serverMap.get(key).iscsiInitiatorNames.push(path.serverEndPoint);
                }
            });

             serverMap.forEach(function (value) {
                 payload.serverInfos.push(value);
             });

            _.each(selected.luns, function (lun) {
                payload.externalLuns.push({
                    portId: lun.portId,
                    wwn: lun.wwn,
                    lunId: lun.lunId,
                    iscsiInfo: lun.externalIscsiInformation ? {
                        ipAddress: lun.externalIscsiInformation.ipAddress,
                        iscsiName: lun.externalIscsiInformation.iscsiName
                    } : undefined
                });
            });
            return payload;
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