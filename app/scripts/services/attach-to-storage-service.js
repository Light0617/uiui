/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc service
 * @name rainierApp.attachToStorageService
 * @description
 * # attachToStorageService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('attachToStorageService', function (
        attachVolumeService, previrtualizeService, virtualizeVolumeService
    ) {
        var generateGetPathFn = function (sourceCoordinates, targetCoordinates) {
            return function (path) {
                return attachVolumeService.createPath(
                    112,
                    sourceCoordinates[path.preVirtualizePayload.srcPort].y,
                    targetCoordinates[path.storagePortId].x,
                    targetCoordinates[path.storagePortId].y
                );
            };
        };

        var generatePathModel = function (
            sourcePorts,
            targetPorts
        ) {
            var sourceCoordinates = {};
            var targetCoordinates = {};
            var viewBoxHeight = virtualizeVolumeService.getViewBoxHeight(
                sourcePorts, targetPorts, sourceCoordinates, targetCoordinates
            );
            return {
                paths: [],
                sourcePorts: sourcePorts,
                storagePorts: targetPorts,
                createPath: attachVolumeService.createPath,
                viewBoxHeight: viewBoxHeight,
                sourceCoordinates: sourceCoordinates,
                targetCoordinates: targetCoordinates,
                getPath: generateGetPathFn(sourceCoordinates, targetCoordinates)
            };
        };

        var portsInfo = function (paths) {
            paths = _.filter(paths, function (path) {
                return path.deleted !== true;
            });

            return _.map(paths, function (p) {
                return previrtualizeService.createPrevirtualizePayloadPortInfo(
                    p.serverEndPoint,
                    p.preVirtualizePayload ? p.preVirtualizePayload.targetWwn : undefined,
                    // TODO for iSCSI Virtualize
                    undefined
                );
            });
        };

        return {
            generatePathModel: generatePathModel,
            portsInfo: portsInfo,
        };
    });
