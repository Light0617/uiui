/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

angular.module('rainierApp')
    .factory('portDiscoverService', function (
        $q,
        apiResponseHandlerService,
        Restangular,
        orchestratorService
    ) {
        // var keyForDiscovered = 'hashKey';
        var discoverManagedVolumes = function (
            externalPaths,
            volumeIds,
            sourceStorageSystemId,
            targetStorageSystemId
        ) {
            var targetPortIds = _.map(externalPaths, 'targetPortId');
            var targetPortHash; //targetEndPointVolumeHash
            targetPortEndPointHash(targetStorageSystemId, targetPortIds)
                .then(function (result) {
                    targetPortHash = result;
                })
                .then(function () {
                    volumeEndPointHash(sourceStorageSystemId, volumeIds);
                });
        };

        var volumeEndPointHash = function (sourceStorageSystemId, volumeIds) {
            return $q.all(
                _.map(volumeIds, function (volumeId) {
                    return orchestratorService.volume(sourceStorageSystemId, volumeId);
                })
            ).then(function (volumes) {
                var flattened = flattenVolumesByTargetEndPoint(volumes);
                var hashed = _.indexBy(flattened, 'lunNEndPoint');
                return $q.resolve(hashed);
            });
        };

        var lunNEndPoint = function (endPoint, lun) {
            return endPoint + '_' + lun;
        };

        var flattenVolumesByTargetEndPoint = function (volumes) {
            var flattened = [];
            _.forEach(volumes, function (v) {
                var endPoints = targetEndPointsOfSourceVolume(v);
                var copied = _.map(endPoints, function (endPoint) {
                    return {
                        volumeId: v.volumeId,
                        label: v.label,
                        capacity: v.capacity,
                        endPoint: endPoint.targetEndPoint,
                        lun: endPoint.lun,
                        lunNEndPoint: lunNEndPoint(endPoint.targetEndPoint, endPoint.lun)
                    };
                });
                flattened.push(copied);
            });
            return _.flatten(flattened);
        };

        var targetEndPointsOfSourceVolume = function (volume) {
            return _.chain(volume.attachedVolumeServerSummary)
                .map(function (summary) {
                    return summary.paths;
                })
                .flatten()
                .map(targetEndPointsOfVolumePath)
                .flatten()
                .value();
        };

        var targetEndPointsOfVolumePath = function (path) {
            var appendLun = function (endPoint) {
                return {
                    targetEndPoint: endPoint,
                    lun: path.lun
                };
            };

            if (!path) {
                return [];
            } else if (path.wwns) {
                return _.map(path.wwns, appendLun);
            } else if (
                path.iscsiTargetInformation &&
                path.iscsiTargetInformation.iscsiInitiatorNames
            ) {
                return _.map(path.iscsiTargetInformation.iscsiInitiatorNames, appendLun);
            }
            return [];
        };

        var targetPortEndPointHash = function (targetStorageId, targetPortIds) {
            return $q.all(
                _.map(targetPortIds, function (targetPortId) {
                    return orchestratorService.storagePort(targetStorageId, targetPortId)
                        .then(appendTargetEndPointToTargetPort);
                })
            ).then(function (ports) {
                return $q.resolve(_.indexBy(ports, 'storagePortId'));
            });
        };

        var appendTargetEndPointToTargetPort = function (port) {
            port.endPoint = targetEndPointOfTargetPort(port);
            return $q.resolve(port);
        };

        var targetEndPointOfTargetPort = function (port) {
            if (!_.isUndefined(port.wwn)) {
                return port.wwn;
            } else if (
                !_.isUndefined(port.iscsiPortInformation) &&
                !_.isUndefined(port.iscsiPortInformation.portIscsiName)
            ) {
                return port.iscsiPortInformation.portIscsiName;
            }
        };

        /**
         * path : {
         *    targetPortId: 'target portId',
         *    sourceEndPoint: {
         *        wwn: 'source storage port wwn', // nullable for iSCSI
         *        iscsiInfo: { // nullable for Fibre
         *            iscsiName: 'source storage port IscsiName',
         *            ip: 'source storage port ip address'
         *        }
         *    }
         * }
         */
        var discoverManagedVolumesFromPaths = function (
            // paths,
            // volumeIds,
            // sourceStorageId,
            // targetStorageId,
            // targetPortEndPointHash
        ) {

        };
        //
        // var discoverUnamanagedVolumes = function (
        //     portIds,
        //     storageSystemIds
        // ) {
        //     return discoverLunsHash(portIds, storageSystemIds)
        //         .then(_.toArray);
        // };
        //
        // var getPortsHash = function (portIds, storageSystemId) {
        //     // TODO for management
        // };
        //
        // var endPointOfVolumePath = function (path) {
        //
        // };
        //
        // var keyOfVolumePath = function (path) {
        //
        // };
        //
        // var fillPathsInfoOnVolume = function (attachedVolume) {
        //     attachedVolume.paths = attachedVolume.attachedVolumeServerSummary.paths;
        //     _.forEach(attachedVolume.paths, function (path) {
        //         path[keyForDiscovered] = keyOfVolumePath(path);
        //         path.endPoint = endPointOfVolumePath(path);
        //     });
        //     return attachedVolume;
        // };
        //
        // var getVolumes = function (volumeIds, storageSystemId) {
        //     // TODO for management
        //     return $q.all(
        //         _.map(
        //             volumeIds,
        //             function (volumeId) {
        //                 return orchestratorService.volume(storageSystemId, volumeId);
        //             }
        //         )
        //     )
        // };
        //
        // var endPointOfLun = function (discoveredLun) {
        //     if (!_.isUndefined(discoveredLun.wwn)) {
        //         return discoveredLun.wwn;
        //     } else if (
        //         !_.isUndefined(discoveredLun.iscsiInfo) &&
        //         !_.isUndefined(discoveredLun.iscsiInfo.ip) &&
        //         !_.isUndefined(discoveredLun.iscsiInfo.iscsiName)
        //     ) {
        //         return discoveredLun.iscsiInfo.ip + '_' + discoveredLun.iscsiInfo.iscsiName;
        //     }
        // };
        //
        // var keyOf = function (discoveredLun) {
        //     return [discoveredLun.portId, discoveredLun.lunId, endPointOfLun(discoveredLun)].join('_');
        // };
        //
        // var appendKey = function (discoveredLun) {
        //     discoveredLun[keyForDiscovered] = keyOf(discoveredLun);
        //     discoveredLun.endPoint = endPointOfLun(discoveredLun);
        //     return discoveredLun;
        // };
        //
        // var discoveredLunsToHash = function (discoveredLuns) {
        //     return _.chain(discoveredLuns).map(appendKey)
        //         .indexBy(keyForDiscovered).value();
        // };
        //
        // var discoverLunsHash = function (portIds, storageSystemId) {
        //     return discoverLuns(portIds, storageSystemId)
        //         .then(discoveredLunsToHash);
        // };
        //
        // var discoverLuns = function (portIds, storageSystemId) {
        //     var requests = _.map(portIds, function (pid) {
        //         return orchestratorService.discoverLun(pid, storageSystemId);
        //     });
        //     return $q.all(requests)
        //         .then(_.flatten);
        // };

        return {
            discoverManagedVolumes: discoverManagedVolumes,
            // discoverUnmanagedVolumes: discoverUnamanagedVolumes,
            // discoverLuns: discoverLuns,
            targetPortEndPointHash: targetPortEndPointHash,
            volumeEndPointHash: volumeEndPointHash,
            flattenVolumesByTargetEndPoint: flattenVolumesByTargetEndPoint,
            targetEndPointsOfSourceVolume: targetEndPointsOfSourceVolume,
            targetEndPointsOfVolumePath: targetEndPointsOfVolumePath,
            appendTargetEndPointToTargetPort: appendTargetEndPointToTargetPort,
            targetEndPointOfTargetPort: targetEndPointOfTargetPort,
            discoverManagedVolumesFromPaths: discoverManagedVolumesFromPaths
        };
    });
