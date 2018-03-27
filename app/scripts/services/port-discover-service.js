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
        };

        var getPortsHash = function (portIds, storageSystemId) {

        };

        var getVolumes = function (volumeIds, storageSystemId) {

        };

        var discoverGroups = function (portIds, storageSystemId) {
            var requests = _.map(portIds, function (pid) { return discoverGroup(pid, storageSystemId); });
            return $q.all(requests)
                .then(function (multiLevelDeep) { return _.flatten(multiLevelDeep); })
                .then(function (singleLevelDeep) {  });
        };

        var discoverGroup = function (portId, storageSystemId) {
            var url = 'storage-systems/' + storageSystemId + '/storage-ports/' + portId + '/discover-groups';
            return apiResponseHandlerService._apiResponseHandler(Restangular.one(url).post({}))
        };

        return {
            discoverManagedVolumes: discoverManagedVolumes,
            discoverUnmanagedVolumes: discoverUnmanagedVolumes
        };
    });
