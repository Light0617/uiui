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
        Restangular
    ) {
        var keyForDiscovered = 'hashKey';
        var discoverManagedVolumes = function (
            tgtPortIds,
            srcPortIds,
            tgtStorageSystemId,
            srcStorageSystemId,
            srcVolumeIds
        ) {
            var tgtPortHash, srcPortHash, srcVolumes, discoveredLunsHash;

        };

        var discoverUnmanagedVolumes = function (
            tgtPortIds,
            tgtStorageSystemId
        ) {
            return discoverGroups(tgtPortIds, tgtStorageSystemId);
        };

        var getPortsHash = function (portIds, storageSystemId) {

        };

        var getVolumes = function (volumeIds, storageSystemId) {

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
            discoveredLun[keyForDiscovered]= keyOf(discoveredLun);
            discoveredLun.endPoint = endPoint(discoveredLun);
            return discoveredLun;
        };

        var discoveredGroupsToHash = function (discoveredLuns) {
            return _.chain(discoveredLuns).map(appendKey)
                .indexBy(keyForDiscovered).value();
        };

        var discoverGroup = function (portId, storageSystemId) {
            var url = 'storage-systems/' + storageSystemId + '/storage-ports/' + portId + '/discover-groups';
            return apiResponseHandlerService._apiResponseHandler(Restangular.one(url).post({}))
        };

        var discoverGroups = function (portIds, storageSystemId) {
            var requests = _.map(portIds, function (pid) { return discoverGroup(pid, storageSystemId); });
            return $q.all(requests)
                .then(_.flatten)
                .then(discoveredGroupsToHash);
        };

        return {
            discoverManagedVolumes: discoverManagedVolumes,
            discoverUnmanagedVolumes: discoverUnmanagedVolumes
        };
    });
