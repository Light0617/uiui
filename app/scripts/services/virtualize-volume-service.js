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

        function constructVirtualizePayload(dataModel) {
            var serverMap = new Map();
            var payload = {
                targetPortsInfo: [],
                serverInfos: [],
                luns: [],
                storageSystemId: dataModel.storageSystemId,
                hostMode: dataModel.attachModel.selectedHostMode,
                hostModeOptions: dataModel.attachModel.selectedHostModeOption,
                enableZoning: false,
                useDefaultHostModeOptions: false,
                forceOverwriteChapSecret: false
            };
            _.each(dataModel.preVirtualizationPaths, function (path) {
                payload.targetPortsInfo.push(path.storagePortId);
            });
            _.each(dataModel.pathModel.paths, function (path) {
                var key = path.storagePortId + path.serverId;
                var serverInfo = {
                    targetPortForHost: path.storagePortId,
                    serverId: parseInt(path.serverId),
                    serverWwn: [path.serverEndPoint],
                    iscsInitiatorNames: ['', '']
                };
                if(serverMap.has(key)) {
                    serverMap.get(key).serverWwn.push(path.serverEndPoint);
                } else {
                    serverMap.set(key, serverInfo);
                }
            });
            payload.serverInfos = Array.from(serverMap.values());
            _.each(dataModel.selectedDiscoveredVolumes, function (vol) {
                payload.luns.push(parseInt(vol.volumeId));
            });
            return payload;
        }

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

                    modalInstance.result.finally(function() {
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
            getViewBoxHeight: function(sourcePorts, targetPorts, sourceCoordinates, targetCoordinates) {
                attachVolumeService.setPortCoordiantes(sourcePorts, sourceCoordinates);
                attachVolumeService.setPortCoordiantes(targetPorts, targetCoordinates);

                var sourceHeight = sourcePorts[sourcePorts.length - 1].coordinate.y + 30;

                var targetHeight = targetPorts[targetPorts.length - 1].coordinate.y + 30;

                return Math.max(sourceHeight, targetHeight);
            },
            constructVirtualizePayload: constructVirtualizePayload,
            invokeOpenAttachToStorage: invokeOpenAttachToStorage
        };
    });