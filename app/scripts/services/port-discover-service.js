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
        orchestratorService
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

        };

        return {
            discoverManagedVolumes: discoverManagedVolumes,
            discoverUnmanagedVolumes: discoverUnmanagedVolumes
        };
    });
