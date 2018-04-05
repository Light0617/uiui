/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

angular.module('rainierApp')
    .factory('previrtualizeService', function (
        $q,
        $timeout,
        orchestratorService,
        constantService
    ) {
        var interval = 5000;
        var upperLimit = 10;

        var previrtualize = function (payload) {
            return orchestratorService.previrtualize(payload)
                .then(function (response) {
                    return $q.resolve(response.jobId);
                });
        };

        var handleJob = function (jobId, defer, count) {
            return function (result) {
                if (!result || result.status === constantService.previrtualizeJobStatus.inprogress) {
                    $timeout(getJob(jobId, defer), interval);
                    count++;
                } else if (upperLimit <= count ||
                    result.status === constantService.previrtualizeJobStatus.failed) {
                    // TODO confirm we have to show dialog or not
                    defer.resolve(false);
                } else {
                    defer.resolve(result);
                }
            };
        };

        var getJob = function (jobId, defer, count) {
            return function () {
                return orchestratorService.jobStatus(jobId)
                    .then(handleJob(jobId, defer, count))
                    .catch(function () {
                        return defer.resolve(false);
                    });
            };
        };

        var poll = function () {
            var count = 0;
            return function(jobId) {
                var defer = $q.defer();
                getJob(jobId, defer, count)();
                return defer.promise;
            };
        };

        var previrtualizeAndDiscover = function (payload) {
            return previrtualize(payload)
                .then(poll())
                .then(function (result) {
                    if (result && result.status === constantService.previrtualizeJobStatus.success) {
                        return $q.resolve(true);
                    }
                    // TODO make sure the message for previrtualize
                    return $q.reject('Failed to previrtualize');
                });
        };

        var createPrevirtualizePayloadPortInfo = function (
            srcPort,
            targetWwn,
            iscsiTargetInformation
        ) {
            return {
                srcPort: srcPort,
                targetWwn: targetWwn,
                iscsiTargetInformation: iscsiTargetInformation
            };
        };

        var createPrevirtualizePayload = function (
            sourceStorageSystemId,
            targetStorageSystemId,
            portsInfo,
            volumeIds
        ) {
            return {
                sourceStorageSystemId: sourceStorageSystemId,
                targetStorageSystemId: targetStorageSystemId,
                portsInfo: portsInfo,
                volumes: _.chain(volumeIds).map(function (volId) {
                    return {volumeId: volId};
                }).value()
            };
        };

        return {
            // For Specs
            handleJob: handleJob,
            previrtualize: previrtualize,
            // For UI
            previrtualizeAndDiscover: previrtualizeAndDiscover,
            createPrevirtualizePayload: createPrevirtualizePayload,
            createPrevirtualizePayloadPortInfo: createPrevirtualizePayloadPortInfo
        };
    });
