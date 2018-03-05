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
                item.status = 'SCHEDULED';
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

    var setPoolsGridSetting = function (dataModel) {
        // same as storage-pools.js
        dataModel.gridSettings = [
            {
                title: 'ID',
                sizeClass: 'eighteenth',
                sortField: 'storagePoolId',
                getDisplayValue: function (item) {
                    return item.storagePoolId;
                },
                type: 'id'
            },
            {
                title: 'Name',
                sizeClass: 'sixth',
                sortField: 'label',
                getDisplayValue: function (item) {
                    return item.label;
                }
            },
            {
                title: 'Type',
                sizeClass: 'eighteenth',
                sortField: 'type',
                getDisplayValue: function (item) {
                    return synchronousTranslateService.translate(item.type);
                }
            },
            {
                title: 'pool-active-flash',
                sizeClass: 'eighteenth',
                sortField: 'activeFlashEnabled',
                getDisplayValue: function (item) {
                    return item.activeFlashEnabled ? 'pool-active-flash' : '';
                },
                getIconClass: function (item) {
                    return item.activeFlashEnabled ? 'icon-checkmark' : '';
                },
                type: 'icon'
            },
            {
                title: 'common-label-total',
                sizeClass: 'twelfth',

                sortField: 'capacityInBytes.value',
                getDisplayValue: function (item) {
                    return item.capacityInBytes;
                },
                type: 'size'
            },
            {
                title: 'common-label-free',
                sizeClass: 'twelfth',
                sortField: 'availableCapacityInBytes.value',
                getDisplayValue: function (item) {
                    return item.availableCapacityInBytes;
                },
                type: 'size'
            },
            {
                title: 'common-label-used',
                sizeClass: 'twelfth',
                sortField: 'usedCapacityInBytes.value',
                getDisplayValue: function (item) {
                    return item.usedCapacityInBytes;
                },
                type: 'size'
            }
        ];
    };

    return {
        getMigrationPairs: getMigrationPairs,
        getAllMigrationPairs: getAllMigrationPairs,
        mergeJobInfo: mergeJobInfo,
        setPoolsGridSetting: setPoolsGridSetting
    };
});