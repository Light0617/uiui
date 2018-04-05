'use strict';

/**
 * @ngdoc service
 * @name rainierApp.virtualizeVolumeService
 * @description
 * # virtualizeVolumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('virtualizeVolumeService', function (attachVolumeService) {

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

        return {
            getViewBoxHeight: function(sourcePorts, targetPorts, sourceCoordinates, targetCoordinates) {
                attachVolumeService.setPortCoordiantes(sourcePorts, sourceCoordinates);
                attachVolumeService.setPortCoordiantes(targetPorts, targetCoordinates);

                var sourceHeight = sourcePorts[sourcePorts.length - 1].coordinate.y + 30;

                var targetHeight = targetPorts[targetPorts.length - 1].coordinate.y + 30;

                return Math.max(sourceHeight, targetHeight);
            },
            constructVirtualizePayload: constructVirtualizePayload
        };
    });