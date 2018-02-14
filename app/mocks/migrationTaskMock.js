/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

rainierAppMock.factory('migrationTaskMock', function (mockUtils, jobMock, storageSystemMock) {
    var migrationTasks = [];
    var volumeNumbers = {};
    var statuses = {};

    var generateMockMigrationTasks = function () {
        var total = 120;
        migrationTasks = [];
        volumeNumbers = {};
        statuses = {};

        while (total-- !== 0) {
            var migrationTask = generateMockMigrationTask(total);
            migrationTasks.push(migrationTask);
        }
    };

    var generateMockMigrationTask = function (num) {
        var numOfVols = _.sample([32, 64, 120, 16]);
        var schedule = {};
        var datetime = 'N/A';
        var jobStatus = _.sample(['SUCCESS', 'IN_PROGRESS', 'FAILED', 'SUCCESS_WITH_ERRORS']);

        var job;
        var status;
        if (mockUtils.randomInt(0, 5) < 4) {
            var endDate;
            var startDate;
            var now = new Date();
            var start = now;
            now.setHours(now.getHours() - mockUtils.randomInt(1, 100));
            if (jobStatus !== 'IN_PROGRESS') {
                endDate = mockUtils.dateInISO(now);
                start = new Date(now.getTime());
                start.setHours(start.getHours() - mockUtils.randomInt(1, 100));
                startDate = mockUtils.dateInISO(start);
            } else {
                startDate = mockUtils.dateInISO(now);
            }
            job = jobMock.create('VolumeMigrationJob-' + num, jobStatus, startDate, endDate);
            job.tags.push('MigrationTask');
            if (job.status === 'SUCCESS') {
                status = 'Success';
            } else if (job.status === 'IN_PROGRESS' || job.status === 'InProgress') {
                status = 'In Progress';
                job.status = 'IN_PROGRESS';
            } else if (job.status === 'FAILED') {
                status = 'Failed';
            } else if (job.status === 'SUCCESS_WITH_ERRORS') {
                status = 'Success with Errors';
            }
            if (mockUtils.randomInt(0, 3) < 1) {
                datetime = mockUtils.dateInISO(start);
                schedule.datetime = datetime;
            }
        } else {
            status = 'Scheduled';
            var now = new Date();
            now.setHours(now.getHours() + mockUtils.randomInt(1, 100));
            datetime = mockUtils.dateInISO(now);
            schedule.datetime = datetime;
        }
        var groupId = num;
        volumeNumbers[groupId] = numOfVols;
        statuses[groupId] = status;

        return {
            'migrationTaskId': groupId,
            'migrationTaskName': 'VolumeMigration-' + num,
            'jobId': (job !== undefined)? job.jobId : 'N/A',
            'schedule': schedule,
            'comments': 'Migration task comments.'
        };
    };

    var generateMockMigrationPairs = function (migrationTask) {
        var groupId = migrationTask.migrationTaskId;
        var total = (volumeNumbers[groupId]) ? volumeNumbers[groupId] : 16;
        var status = (statuses[groupId]) ? statuses[groupId] : 'In Progress';
        var migrationPairs = [];
        var volNumBase = mockUtils.randomInt(0, 70);
        var targetPoolId = mockUtils.randomInt(0, 50);

        var pairStatuses;
        if (status === 'Scheduled') {
            pairStatuses = ['NotMigrated'];
        } else if (status === 'In Progress') {
            pairStatuses = ['Migrating', 'Migrated', 'NotMigrated'];
        } else {
            pairStatuses = ['Migrated', 'NotMigrated'];
        }
        while (total-- !== 0) {
            var mockPair = generateMockMigrationPair(groupId, total, pairStatuses, volNumBase, targetPoolId);
            migrationPairs.push(mockPair);
        }

        return migrationPairs;
    };

    var generateMockMigrationPair = function (parentId, volNumber, pairStatuses, volNumBase, targetPoolId) {
        var status = _.sample(pairStatuses);
        var copyGroup = 'N/A';
        var copyProgress = 0;
        var isSourcePool = mockUtils.randomInt(0, 1);
        if (status === 'Migrating' || status === 'Migrated') {
            copyGroup = 'HSA-Reserved-' + volNumBase + '-' + '0';
        }
        if (status === 'Migrating') {
            copyProgress = mockUtils.randomInt(0, 100);
        } else if (status === 'Migrated') {
            copyProgress = 100;
        }

        return {
            'migrationTaskId': parentId,
            'sourceVolumeId': volNumber + volNumBase,
            'sourcePoolId': (isSourcePool === 0)? mockUtils.randomInt(0, 10) : undefined,
            'sourceParityGroupId': (isSourcePool === 1)? '1-' + mockUtils.randomInt(0, 64) : 'N/A',
            'targetVolumeId': (status !== 'NotMigrated') ? 300 + volNumber + volNumBase : undefined,
            'targetPoolId': targetPoolId,
            'status': status,
            'copyProgress': copyProgress,
            'copyGroup': copyGroup
        };
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.subResourceId) {
            var migrationTask = mockUtils.fromCollection(migrationTasks, parseInt(urlResult.subResourceId), 'migrationTaskId');
            return (migrationTask) ? mockUtils.response.ok(migrationTask) : mockUtils.response.notFound('Unable to find endpoint with matching Id.');
        }

        var storageSystemId = urlResult.resourceId + '';
        var storageSystems = storageSystemMock.getMock();
        var storageSystem = _.find(storageSystems, function (item) {
            return item.storageSystemId === storageSystemId;
        });
        var numOfGroups = storageSystem && storageSystem.migrationGroupCount !== undefined ?
                storageSystem.migrationGroupCount : 10;
        var mgs = [];
        _.each(migrationTasks, function(vm) {
            if (mgs.length < numOfGroups) {
                mgs.push(vm);
            }
        });
        var nextToken = 0;
        _.forEach(urlResult.queryParams, function (item) {
            if (item.indexOf('nextToken=') === 0) {
                nextToken = parseInt(item.substring(10));
            }
        });

        return mockUtils.response.ok(mockUtils.pageCollectionResponse(mgs, 'resources',
            nextToken, mgs.length));
    };

    var handleGetPairsRequest = function (urlResult) {
        var storageSystemId = urlResult.resourceId + '';
        var mgId = 'N/A';
        var nextToken = 0;
        _.forEach(urlResult.queryParams, function (item) {
            if (item.indexOf('q=migrationTaskId:') === 0) {
                mgId = item.substring(19);
            } else if (item.indexOf('nextToken=') === 0) {
                nextToken = parseInt(item.substring(10));
            }
        });
        if (mgId !== 'N/A') {
            var mg = mockUtils.fromCollection(migrationTasks, parseInt(mgId), 'migrationTaskId');
            if (mg) {
                var migrationPairs = generateMockMigrationPairs(mg);
                return mockUtils.response.ok(mockUtils.pageCollectionResponse(migrationPairs, 'resources', nextToken, migrationPairs.length));
            } else {
                return mockUtils.response.notFound('Unable to find volume migration with matching Id.');
            }

        }
        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse([]));
    };


    return {
        init: function () {
            generateMockMigrationTasks();
        },
        getMock: function () {
            return migrationTasks;
        },
        generateMockMigrationTasks: generateMockMigrationTasks(),
        handle: function (urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return handleGetRequest(urlResult);
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        },
        handlePairs: function (urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return handleGetPairsRequest(urlResult);
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});