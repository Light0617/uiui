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
        var keyForDiscovered = 'hashKey';
        var discoverManagedVolumes = function (
            tgtPortIds,
            srcPortIds,
            tgtStorageSystemId,
            srcStorageSystemId,
            srcVolumeIds
        ) {
            $q.all([
                getAndStorePortsHash(tgtPortIds, tgtStorageSystemId),
                getAndStorePortsHash(srcPortIds, srcStorageSystemId),
                getAndStoreVolumes(srcVolumeIds, srcStorageSystemId),
                discoverAndStoreLuns(tgtPortIds, tgtStorageSystemId)
            ]);
            // TODO for management
        };

        var getAndStorePortsHash = function (portIds, storageSystemId) {
            // TODO for management
        };

        var getAndStoreVolumes = function (volumeIds, storageSystemId) {
            // TODO for management
        };

        var endPoint = function (discoveredLun) {
            if (!_.isUndefined(discoveredLun.wwn)) {
                return discoveredLun.wwn;
            } else if (
                !_.isUndefined(discoveredLun.iscsiInfo) &&
                !_.isUndefined(discoveredLun.iscsiInfo.ip) &&
                !_.isUndefined(discoveredLun.iscsiInfo.iscsiName)
            ) {
                return discoveredLun.iscsiInfo.ip + '_' + discoveredLun.iscsiInfo.iscsiName;
            }
        };

        var keyOf = function (discoveredLun) {
            return discoveredLun.portId + discoveredLun.lun + endPoint(discoveredLun);
        };

        var appendKey = function (discoveredLun) {
            discoveredLun[keyForDiscovered] = keyOf(discoveredLun);
            discoveredLun.endPoint = endPoint(discoveredLun);
            return discoveredLun;
        };

        var discoveredLunsToHash = function (discoveredLuns) {
            return _.chain(discoveredLuns).map(appendKey)
                .indexBy(keyForDiscovered).value();
        };

        var discoverAndStoreLuns = function (portIds, storageSystemId) {
            return discoverLuns(portIds, storageSystemId)
                .then(discoveredLunsToHash);
        };

        var discoverLuns = function (portIds, storageSystemId) {
            var requests = _.map(portIds, function (pid) {
                return orchestratorService.discoverLun(pid, storageSystemId);
            });
            return $q.all(requests)
                .then(_.flatten);
        };

        return {
            discoverManagedVolumes: discoverManagedVolumes,
            discoverLuns: discoverLuns
        };
    });
