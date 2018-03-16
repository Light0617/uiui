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
        orchestratorService
    ) {
        var interval = 1;
        var upperLimit = 10;
        var count = 0;
        var interrupted = false;
        var pollingPromise;

        var previrtualize = function (storageSystemId, payload) {
            return orchestratorService.previrtualize(storageSystemId, payload)
                .then(function (response) {
                    return $q.resolve(response.jobId);
                });
        };

        var handleJob = function (jobId, defer) {
            return function (result) {
                if (!result || result.status === 'inprogress') {
                    $timeout(getJob(jobId, defer), interval);
                    // getJob(jobId, defer)();
                } else if (interrupted || upperLimit <= count || result.status === 'failed') {
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

        var preVirtualizeAndDiscover = function (storageSystemId, payload) {
            previrtualize(storageSystemId, payload)
                .then(poll)
                .then(function (result) {
                    if (result) {
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

        return {
            discover: discover,
            handleJob: handleJob,
            poll: poll,
            previrtualize: previrtualize,
            stopPolling: stopPolling,
            preVirtualizeAndDiscover: preVirtualizeAndDiscover
        };
    });
