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
                    return orchestratorService.discoverLun(portId, targetStorageSystemId, {})
                        .then(checkDiscoveredLunsLengthFn(portId));
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
            }).catch(function (e) {
                if (e.data && e.data.message) {
                    return $q.reject(e);
                }
                return $q.reject('Failed to discover luns from selected ports because of a timeout or some network issues.');
            });
        };

        var checkDiscoveredLunsLengthFn = function (portId) {
            return function (luns) {
                if (luns.length) {
                    return luns;
                }
                return $q.reject({
                    data: {
                        message: 'Selected port ' + portId + ' does not have any available luns.'
                    }
                });
            };
        };

        var appendSourceEndPointToDiscoveredLuns = function (lun) {
            var sourceEndPoint = sourceEndPointOfLun(lun);
            if (sourceEndPoint) {
                return _.assign(
                    {},
                    lun,
                    { sourceEndPoint: sourceEndPoint },
                    { lunNSourceEndPoint: lunNEndPoint(sourceEndPoint, lun.lunId) }
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
         * create external paths from paths wich created from wizard-svg-page
         */
        var createExternalPath = function (paths, sourceStoragePorts) {
            var portIdHash = _.indexBy(sourceStoragePorts, 'storagePortId');
            var externalPaths = _.chain(paths)
                .map(function (path) {
                    return { sourcePortId: path.serverEndPoint, targetPortId: path.storagePortId };
                })
                .map(function (path) {
                    var sourcePort = portIdHash[path.sourcePortId];
                    return _.assign(path, { sourceEndPoint: sourceEndPointOfPort(sourcePort) });
                })
                .filter(function (path) {
                    return path.sourceEndPoint;
                })
                .value();
            return externalPaths;
        };

        var sourceEndPointOfPort = function (port) {
            if (port.wwn) {
                return {
                    wwn: port.wwn
                };
            } else if (port.iscsiPortInformation && port.iscsiPortInformation.portIscsiName) {
                if (
                    port.iscsiPortInformation.ipv4Information &&
                    port.iscsiPortInformation.ipv4Information.address
                ) {
                    return {
                        iscsiName: port.iscsiPortInformation.portIscsiName,
                        ip: port.iscsiPortInformation.ipv4Information.address
                    };
                } else if (
                    port.iscsiPortInformation.ipv6Information &&
                    port.iscsiPortInformation.ipv6Information.address
                ) {
                    return {
                        iscsiName: port.iscsiPortInformation.portIscsiName,
                        ip: port.iscsiPortInformation.ipv6Information.address
                    };
                }
                return undefined;
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
            var result = _.chain(discoveredLunsWithEndPoint)
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
            return result;
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
                        { endPoint: endPoint }
                    );
                })
                .filter(function (discoveredLun) {
                    return discoveredLun.endPoint;
                })
                .map(function (discoveredLun) {
                    return _.assign(
                        discoveredLun,
                        { lunNEndPoint: lunNEndPoint(discoveredLun.endPoint, discoveredLun.lunId) }
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
                        path.targetPortId,
                        targetStorageId,
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
                    return _.assign({}, v, {
                        endPoint: endPoint.targetEndPoint,
                        lun: endPoint.lun,
                        lunNEndPoint: lunNEndPoint(endPoint.targetEndPoint, endPoint.lun)
                    });
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
            createExternalPath: createExternalPath,
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
