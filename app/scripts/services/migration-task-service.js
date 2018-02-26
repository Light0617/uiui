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
 * @name rainierApp.migrationTaskService
 * @description
 * # migrationTaskService
 * Provider in the rainierApp.
 */

angular.module('rainierApp')
    .factory('migrationTaskService', function ($q, Restangular, apiResponseHandlerService, orchestratorService,
                                                paginationService, synchronousTranslateService, queryService,
                                                objectTransformService) {
    var MIGRATION_PAIRS_PATH = 'migration-pairs';
    var dispStatusConst = {
        SCHEDULED: 'Scheduled',
        IN_PROGRESS: 'In Progress',
        SUCCESS: 'Success',
        FAILED: 'Failed',
        SUCCESS_WITH_ERRORS: 'Success with Errors'
    };
    var rawStatusConst = {
        SCHEDULED: 'SCHEDULED',
        // Followings are same as Job.status
        IN_PROGRESS: 'IN_PROGRESS',
        SUCCESS: 'SUCCESS',
        FAILED: 'FAILED',
        SUCCESS_WITH_ERRORS: 'SUCCESS_WITH_ERRORS'
    };

    var mergeJobInfo = function (resources) {
        var tasks = [];
        _.forEach(resources, function (item) {
            if (item.jobId && item.jobId !== 'N/A') {
                tasks.push(apiResponseHandlerService._apiGetResponseHandler(Restangular.one('jobs', item.jobId).get()
                    .then(function (job) {
                        item.status = job.status;
                        item.jobStartDate = job.startDate;
                        item.jobEndDate = job.endDate;
                    })));
            } else {
                item.status = rawStatusConst.SCHEDULED;
            }
        });

        return $q.all(tasks).then(function () {
            _.forEach(resources, function (item) {
                objectTransformService.transformMigrationTask(item);
            });
            return resources;
        });
    };

    var getMigrationPairs = function (token, storageSystemId, migrationTask) {
        var queryParams = {q: ['migrationTaskId:' + migrationTask.migrationTaskId]};
        if (token !== undefined) {
            queryParams.nextToken = token;
        }
        return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId)
            .one(MIGRATION_PAIRS_PATH).get(queryParams).then(function (result) {
                _.forEach(result.resources, function (item) {
                    objectTransformService.transformMigrationPair(item);
                });
                return result;
            }));
    };

    var getAllMigrationPairs = function (storageSystemId, migrationTaskId) {
        paginationService.clearQuery();
        queryService.setQueryMapEntry('migrationTaskId', migrationTaskId);
        return paginationService.getAllPromises(null, MIGRATION_PAIRS_PATH, false, storageSystemId,
            objectTransformService.transformMigrationPair);
    };

    return {
//        isScheduled: function (status) {
//            return status === dispStatusConst.SCHEDULED ||
//                status === rawStatusConst.SCHEDULED;
//        },
//        isInProgress: function (status) {
//            return status === dispStatusConst.IN_PROGRESS ||
//                status === rawStatusConst.IN_PROGRESS;
//        },
//        isSuccess: function (status) {
//            return status === dispStatusConst.SUCCESS ||
//                status === rawStatusConst.SUCCESS;
//        },
//        isFailed: function (status) {
//            return status === dispStatusConst.FAILED ||
//                status === rawStatusConst.FAILED;
//        },
//        isSuccessWithErrors: function (status) {
//            return status === dispStatusConst.SUCCESS_WITH_ERRORS ||
//                status === rawStatusConst.SUCCESS_WITH_ERRORS;
//        },
        getMigrationPairs: getMigrationPairs,
        getAllMigrationPairs: getAllMigrationPairs,
        mergeJobInfo: mergeJobInfo
    };
});