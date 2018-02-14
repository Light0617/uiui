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
    // TODO Is tooltip needed? If so, resource definition required.
//    var tooltip = {
//        SCHEDULED: function () {
//            return synchronousTranslateService.translate('volume-migration-scheduled-tooltip');
//        },
//        IN_PROGRESS: function () {
//            return synchronousTranslateService.translate('volume-migration-inProgress-tooltip');
//        },
//        SUCCESS: function () {
//            return synchronousTranslateService.translate('volume-migration-success-tooltip');
//        },
//        FAILED: function () {
//            return synchronousTranslateService.translate('volume-migration-failed-tooltip');
//        }
//    };
//    var rawToTooltip = function (raw) {
//        return tooltip[raw]();
//    };
    var rawToDisp = function (status) {
        switch (status) {
            case rawStatusConst.SCHEDULED:
                return dispStatusConst.SCHEDULED;
            case rawStatusConst.IN_PROGRESS:
                return dispStatusConst.IN_PROGRESS;
            case rawStatusConst.SUCCESS:
                return dispStatusConst.SUCCESS;
            case rawStatusConst.FAILED:
                return dispStatusConst.FAILED;
            case rawStatusConst.SUCCESS_WITH_ERRORS:
                return dispStatusConst.SUCCESS_WITH_ERRORS;
            default:
                return status.charAt(0).toUpperCase() + status.toLowerCase().slice(1);
        }
    };
    var dispToRaw = function (status) {
        switch (status) {
            case dispStatusConst.SCHEDULED:
                return rawStatusConst.SCHEDULED;
            case dispStatusConst.IN_PROGRESS:
                return rawStatusConst.IN_PROGRESS;
            case dispStatusConst.SUCCESS:
                return rawStatusConst.SUCCESS;
            case dispStatusConst.FAILED:
                return rawStatusConst.FAILED;
            case dispStatusConst.SUCCESS_WITH_ERRORS:
                return rawStatusConst.SUCCESS_WITH_ERRORS;
            default:
                return status.toString().toUpperCase();
        }
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
                        objectTransformService.transformMigrationTask(item);
                    })));
            } else {
                item.status = rawStatusConst.SCHEDULED;
            }
        });

        return $q.all(tasks).then(function () {
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
        toDisplayStatus: rawToDisp,
        toRawStatus: dispToRaw,
        displayStatuses: dispStatusConst,
        rawStatuses: rawStatusConst,
        isScheduled: function (status) {
            return status === dispStatusConst.SCHEDULED ||
                status === rawStatusConst.SCHEDULED;
        },
        isInProgress: function (status) {
            return status === dispStatusConst.IN_PROGRESS ||
                status === rawStatusConst.IN_PROGRESS;
        },
        isSuccess: function (status) {
            return status === dispStatusConst.SUCCESS ||
                status === rawStatusConst.SUCCESS;
        },
        isFailed: function (status) {
            return status === dispStatusConst.FAILED ||
                status === rawStatusConst.FAILED;
        },
        isSuccessWithErrors: function (status) {
            return status === dispStatusConst.SUCCESS_WITH_ERRORS ||
                status === rawStatusConst.SUCCESS_WITH_ERRORS;
        },
        getMigrationPairs: getMigrationPairs,
        getAllMigrationPairs: getAllMigrationPairs,
        mergeJobInfo: mergeJobInfo
//        tooltip: function (type) {
//            var tooltip = rawToTooltip(dispToRaw(type));
//            if (tooltip) {
//                return tooltip;
//            } else {
//                return type;
//            }
//        }

    };
});