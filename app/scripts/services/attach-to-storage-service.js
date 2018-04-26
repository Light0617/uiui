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
        $modal, attachVolumeService, previrtualizeService,
        virtualizeVolumeService, synchronousTranslateService
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
                    p.targetWwn ? p.targetWwn : null,
                    p.storagePortId
                );
            });
        };

        var openNoPortDialog = function () {
            var modalInstance = $modal.open({
                templateUrl: 'views/templates/error-modal.html',
                windowClass: 'modal fade confirmation',
                backdropClass: 'modal-backdrop',
                controller: function ($scope) {
                    $scope.error = {
                        title: synchronousTranslateService.translate('attach-to-storage-no-ports-title'),
                        message: synchronousTranslateService.translate('attach-to-storage-no-ports-message')
                    };
                    $scope.cancel = function () {
                        modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    };

                    modalInstance.result.finally(function () {
                        modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    });
                }
            });
        };

        return {
            generatePathModel: generatePathModel,
            portsInfo: portsInfo,
            openNoPortDialog: openNoPortDialog
        };
    });
