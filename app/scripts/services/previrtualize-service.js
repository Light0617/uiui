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
        constantService,
        utilService
    ) {
        var interval = 5000;
        var upperLimit = 10;
        var count = 0;
        var interrupted = false;
        var pollingPromise;

        var previrtualize = function (payload) {
            return orchestratorService.previrtualize(payload)
                .then(function (response) {
                    return $q.resolve(response.jobId);
                });
        };

        var handleJob = function (jobId, defer) {
            return function (result) {
                if (!result || result.status === constantService.previrtualizeJobStatus.inprogress) {
                    $timeout(getJob(jobId, defer), interval);
                    count++;
                } else if (interrupted || upperLimit <= count ||
                    result.status === constantService.previrtualizeJobStatus.failed) {
                    // TODO confirm we have to show dialog or not
                    defer.resolve(false);
                } else {
                    defer.resolve(result);
                }
            };
        };

        var getJob = function (jobId, defer) {
            return function () {
                return orchestratorService.jobStatus(jobId)
                    .then(handleJob(jobId, defer))
                    .catch(function (reason) {
                        return defer.resolve(false);
                    });
            };
            return defer.promise;
        };

        var poll = function (jobId) {
            interrupted = false;
            count = 0;
            var defer = $q.defer;
            return getJob(jobId, defer)();
        };

        var discover = function (jobId) {
            return orchestratorService.virtualizedVolumes(jobId);
        };

        var preVirtualizeAndDiscover = function (payload) {
            previrtualize(payload)
                .then(poll)
                .then(function (result) {
                    if (result && !utilService.isNullOrUndef(result.jobId)) {
                        return discover(result.jobId);
                    }
                    return $q.resolve([]);
                });
        };

        var stopPolling = function () {
            if (pollingPromise) {
                $timeout.cancel(pollingPromise);
            }
            interrupted = true;
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
            targetStorageSystemId,
            portsInfo,
            volumeIds
        ) {
            return {
                targetStorageSystemId: targetStorageSystemId,
                portsInfo: portsInfo,
                luns: _.chain(volumeIds).map(function (volId) {
                    return {volumeId: volId};
                }).value()
            };
        };

        return {
            discover: discover,
            handleJob: handleJob,
            poll: poll,
            previrtualize: previrtualize,
            stopPolling: stopPolling,
            preVirtualizeAndDiscover: preVirtualizeAndDiscover,
            createPrevirtualizePayload: createPrevirtualizePayload,
            createPrevirtualizePayloadPortInfo: createPrevirtualizePayloadPortInfo
        };
    });
