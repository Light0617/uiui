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
        orchestratorService
    ) {

        var discoverUnmanagedLuns = function (
            targetPortIds,
            targetStorageSystemId
        ) {
            return $q.all(
                _.map(targetPortIds, function (portId) {
                    return orchestratorService.discoverLun(targetStorageSystemId, portId, {});
                })
            ).then(function (luns) {
                var result = _.chain(luns)
                    .flatten()
                    .map(appendSourceEndPointToDiscoveredLuns)
                    .filter(function (lun) {
                        return lun.lunNSourceEndPoint;
                    })
                    .uniq('lunNSourceEndPoint')
                    .value();
                return $q.resolve(result);
            });
        };

        var appendSourceEndPointToDiscoveredLuns = function (lun) {
            var sourceEndPoint = sourceEndPointOfLun(lun);
            if (sourceEndPoint) {
                return _.assign(
                    {},
                    lun,
                    {sourceEndPoint: sourceEndPoint},
                    {lunNSourceEndPoint: lunNEndPoint(sourceEndPoint, lun.lunId)}
                );
            } else {
                return lun;
            }
        };

        var sourceEndPointOfLun = function (lun) {
            if (lun.wwn) {
                return lun.wwn;
            } else if (
                lun.externalIscsiInformation &&
                lun.externalIscsiInformation.iscsiName &&
                lun.externalIscsiInformation.ipAddress
            ) {
                return lun.externalIscsiInformation.iscsiName +
                    '_' +
                    lun.externalIscsiInformation.ipAddress;
            }
            return undefined;
        };

        /**
         * externalPaths:  [{
         *    targetPortId: 'target portId',
         *    sourceEndPoint: {
         *        wwn: 'source storage port wwn', // nullable for iSCSI
         *        iscsiInfo: { // nullable for Fibre
         *            iscsiName: 'source storage port IscsiName',
         *            ip: 'source storage port ip address'
         *        }
         *    }
         * }]
         */
        var discoverManagedVolumes = function (
            externalPaths,
            volumeIds,
            sourceStorageSystemId,
            targetStorageSystemId
        ) {
            var targetPortIds = _.map(externalPaths, 'targetPortId');
            return $q.all([
                discoverManagedLunsFromPaths(externalPaths, targetStorageSystemId),
                targetPortEndPointHash(targetStorageSystemId, targetPortIds),
                volumeEndPointHash(sourceStorageSystemId, volumeIds)
            ]).then(function (result) {
                var discoveredLuns = result[0];
                var targetPortIdHash = result[1];

                var discoveredLunWithEndPoint = appendTargetEndPointToLuns(discoveredLuns, targetPortIdHash);

                var volumeEndPointHash = result[2];
                return $q.resolve(discoveredVolumes(discoveredLunWithEndPoint, volumeEndPointHash));
            }).then(function (volumes) {
                return $q.resolve(_.uniq(volumes, 'lunNEndPoint'));
            });
        };

        var discoveredVolumes = function (discoveredLunsWithEndPoint, volumeEndPointHash) {
            return _.chain(discoveredLunsWithEndPoint)
                .map(function (lun) {
                    return lun.lunNEndPoint;
                })
                .filter(function (lunNEndPoint) {
                    return lunNEndPoint;
                })
                .map(function (lunNEndPoint) {
                    return volumeEndPointHash[lunNEndPoint];
                })
                .filter(function (volume) {
                    return volume;
                })
                .value();
        };

        var appendTargetEndPointToLuns = function (discoveredLuns, targetPortIdHash) {
            return _.chain(discoveredLuns)
                .map(function (discoveredLun) {
                    var endPoint;
                    if (targetPortIdHash[discoveredLun.portId]) {
                        endPoint = targetPortIdHash[discoveredLun.portId].endPoint;
                    }
                    return _.assign(
                        {},
                        discoveredLun,
                        {endPoint: endPoint}
                    );
                })
                .filter(function (discoveredLun) {
                    return discoveredLun.endPoint;
                })
                .map(function (discoveredLun) {
                    return _.assign(
                        discoveredLun,
                        {lunNEndPoint: lunNEndPoint(discoveredLun.endPoint, discoveredLun.lunId)}
                    );
                })
                .value();
        };

        var discoverManagedLunsFromPaths = function (
            paths,
            targetStorageId
        ) {
            return $q.all(
                _.map(paths, function (path) {
                    return orchestratorService.discoverLun(
                        targetStorageId,
                        path.targetPortId,
                        path.sourceEndPoint
                    );
                })
            ).then(function (result) {
                return $q.resolve(_.flatten(result));
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

        return {
            // Use following 2 functions from outside of the service
            discoverUnmanagedLuns: discoverUnmanagedLuns,
            discoverManagedVolumes: discoverManagedVolumes,
            // Following functions are only exposed for Specs
            discoveredVolumes: discoveredVolumes,
            appendTargetEndPointToLuns: appendTargetEndPointToLuns,
            discoverManagedVolumesFromPaths: discoverManagedLunsFromPaths,
            volumeEndPointHash: volumeEndPointHash,
            flattenVolumesByTargetEndPoint: flattenVolumesByTargetEndPoint,
            targetEndPointsOfSourceVolume: targetEndPointsOfSourceVolume,
            targetEndPointsOfVolumePath: targetEndPointsOfVolumePath,
            targetPortEndPointHash: targetPortEndPointHash,
        };
    });
