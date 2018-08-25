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
                                                objectTransformService, constantService) {
    var MIGRATION_PAIRS_PATH = 'migration-pairs';
    var JOBS_PATH = 'jobs';
    var VOLUMES_PATH = 'volumes';
    var EXTERNAL_VOLUMES_PATH = 'external-volumes';
    var QUERY_KEY_MIGRATION_TYPE = 'migrationSummary.migrationType';
    var QUERY_KEY_OWNER_TASK_ID = 'migrationSummary.ownerTaskId';

    var mergeJobInfo = function (resources) {
        var jobIds = [];
        var jobIdMap = {};
        _.forEach(resources, function (item) {
            if (item.jobId && item.jobId !== 'N/A') {
                jobIds.push({text: item.jobId});
                jobIdMap[item.jobId] = item;
            } else {
                item.status = 'SCHEDULED';
            }
        });
        var promise;
        if (jobIds.length > 0) {
            paginationService.clearQuery();
            queryService.setQueryMapEntry('jobId', jobIds);
            promise = paginationService.getAllPromises(null, JOBS_PATH, false, null, null, null, 'jobs')
                .then(function (result) {
                    _.forEach(result, function (item) {
                        if (item && jobIdMap[item.jobId]) {
                            var migrationTask = jobIdMap[item.jobId];
                            migrationTask.status = item.status;
                            migrationTask.jobStartDate = item.startDate;
                            migrationTask.jobEndDate = item.endDate;
                        }
                    });
                });
        } else {
            promise = $q.resolve();
        }

        return promise.then(function () {
            _.forEach(resources, function (item) {
                objectTransformService.transformMigrationTask(item);
            });
            return resources;
        });
    };

    var getMigrationPairs = function (token, storageSystemId, migrationTask, filterStatuses) {
        var queryFilter = '';
        if (filterStatuses && filterStatuses.length > 0) {
            queryFilter = ' AND status:(' + filterStatuses.join(' OR ') + ')';
        }
        var queryParams = {
            q: ['migrationTaskId:' + migrationTask.migrationTaskId + queryFilter],
            sort: 'sourceVolumeId:asc'
        };
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

    var getVolumes = function (storageSystemId, volumeIds) {
        paginationService.clearQuery();
        //paginationService.setFilterSearch(new paginationService.QueryObject('volumeId', undefined, volumeIds));
        queryService.setQueryMapEntry('volumeId', volumeIds);
        return paginationService.getAllPromises(null, VOLUMES_PATH, false, storageSystemId,
                    objectTransformService.transformVolume);
    };

    var getExternalVolumes = function (storageSystemId, volumeIds) {
        paginationService.clearQuery();
        queryService.setQueryMapEntry('volumeId', volumeIds);
        return paginationService.getAllPromises(null, EXTERNAL_VOLUMES_PATH, false, storageSystemId,
                    objectTransformService.transformExternalVolume);
    };

    var volumeMigrationTypeFilter = function (type, isManaged, migrationType) {
        var queryObject;
        var searchType = new paginationService.SearchType();
        // remove before specification.
        queryObject = new paginationService.QueryObject(QUERY_KEY_MIGRATION_TYPE, undefined, null);
        paginationService.setFilterSearch(queryObject);
        queryObject = new paginationService.QueryObject(QUERY_KEY_OWNER_TASK_ID, undefined, null);
        paginationService.setExistenceSearch(queryObject);

        if (!migrationType || migrationType === '') {
            // no filter
            return;
        }
        switch (type) {
            case constantService.migrationType.NONE:
                queryObject = new paginationService.QueryObject(QUERY_KEY_MIGRATION_TYPE, undefined, type);
                paginationService.setFilterSearch(queryObject);
                queryObject = new paginationService.QueryObject(QUERY_KEY_OWNER_TASK_ID, searchType.MISSING, null);
                paginationService.setExistenceSearch(queryObject);
                break;
            case constantService.migrationType.MIGRATION:
                var existenceType = isManaged ? searchType.EXISTING : searchType.MISSING;
                if (!isManaged) {
                    queryObject = new paginationService.QueryObject(QUERY_KEY_MIGRATION_TYPE, undefined, type);
                    paginationService.setFilterSearch(queryObject);
                }
                queryObject = new paginationService.QueryObject(QUERY_KEY_OWNER_TASK_ID, existenceType, null);
                paginationService.setExistenceSearch(queryObject);
                break;
        }
    };

    var checkLicense = function (storageSystemId) {
        return orchestratorService.licenses(storageSystemId).then(function (result) {
            return _.some(result.licenseSettings, function (license) {
                return (license.productName.toUpperCase() === 'VOLUME MIGRATION' && license.installed === true);
            });
        });
    };

    var isMigrationAvailable = function (volume) {
        var isNotSnapshotPair = volume.isSnapshotPair === undefined || !volume.isSnapshotPair();
        // Not check other pair state, gad state.
        return !volume.isMigrating() && volume.isAttached() && isNotSnapshotPair;
    };

    var isAllMigrationAvailable = function (volumes) {
        return !_.some(volumes, function (volume) {
            return !isMigrationAvailable(volume);
        });
    };

    var toDisplayStatus = function (status) {
        switch (status) {
            case constantService.migrationTaskStatus.SCHEDULED:
                return synchronousTranslateService.translate('migration-task-status-scheduled');
            case constantService.migrationTaskStatus.IN_PROGRESS:
                return synchronousTranslateService.translate('migration-task-status-in-progress');
            case constantService.migrationTaskStatus.SUCCESS:
                return synchronousTranslateService.translate('migration-task-status-success');
            case constantService.migrationTaskStatus.FAILED:
                return synchronousTranslateService.translate('migration-task-status-failed');
            case constantService.migrationTaskStatus.SUCCESS_WITH_ERRORS:
                return synchronousTranslateService.translate('migration-task-status-success-with-errors');
            default:
                if (status) {
                    return status.charAt(0).toUpperCase() + status.toLowerCase().slice(1);
                }
                return constantService.notAvailable;
        }
    };

    return {
        getMigrationPairs: getMigrationPairs,
        getAllMigrationPairs: getAllMigrationPairs,
        mergeJobInfo: mergeJobInfo,
        volumeMigrationTypeFilter: volumeMigrationTypeFilter,
        checkLicense: checkLicense,
        isMigrationAvailable: isMigrationAvailable,
        isAllMigrationAvailable: isAllMigrationAvailable,
        getVolumes: getVolumes,
        getExternalVolumes: getExternalVolumes,
        toDisplayStatus: toDisplayStatus
    };
});