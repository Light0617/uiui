'use strict';

rainierAppMock.factory('replicationgroupmock', function (mockUtils) {
    var replicationGroups = [];
    var affectedVolumePairs = [];

    var generateMockReplicationGroups = function () {
        var total = 2;

        while (total-- !== 0) {
            var mockReplicationGroup = generateMockReplicationGroup(total);
            replicationGroups.push(mockReplicationGroup);
        }
    };

    var generateMockAffectedVolumePairs = function () {
        var total = 6;

        while (total-- !== 0) {
            var mockAffectedVolumePair = generateMockAffectedVolumePair(total);
            affectedVolumePairs.push(mockAffectedVolumePair);
        }
    };

    var generateMockReplicationGroup = function (v) {
        return {
            id: v,
            storageSystemId: '220010',
            name: 'Replication Group' + v,
            comments: 'Test',
            type: _.sample(['SNAPSHOT', 'CLONE', 'SNAPSHOT_EXTENDABLE', 'SNAPSHOT_FULLCOPY']),
            consistent: _.sample([true, false]),
            numberOfCopies: _.random(1, 1024),
            schedule: {hour: 13, minute: 2, recurringUnit: 'WEEKLY', recurringUnitInterval: null, dayOfWeek: ['SUN', 'MON'], dayOfMonth: null},
            scheduleEnabled: _.sample([true, false]),
            primaryVolumeIds: getPrimaryVolumeIds(),
            failures: _.random(1, 10)
        };
    };

    var generateMockAffectedVolumePair = function (v) {
        return {
            replicationGroup: _.sample(['Replication Group' + v, null]),
            volumePairGroup: _.sample(['SnapshotGroup' + v, 'CloneGroup' + v]),
            mirrorId: _.random(1, 20),
            splitTime: 1450814584000,
            consistent: _.sample([true, false]),
            consistencyId: _.random(1, 100),
            type: _.sample(['SNAPSHOT', 'CLONE', 'SNAPSHOT_EXTENDABLE', 'SNAPSHOT_FULLCOPY']),
            primaryVolume: getVolume('p-vol'),
            secondaryVolume: getVolume('s-vol'),
            state: _.sample(['HEALTHY', 'ERROR'])
        };
    };

    var getPrimaryVolumeIds = function () {
        var primaryVolumeIdList = [];
        for (var i = 1; i <= _.random(1, 5); i++) {
            var rand = _.random(1, 3);
            primaryVolumeIdList.push(rand);
        }
        return _.uniq(primaryVolumeIdList);
    };

    var getVolume = function (volume) {
        var rand = _.random(0, 1);
        var result = {
            id: _.random(1, 3)
        };
        if (volume === 'p-vol') {
            result.status = _.sample(['SMPL', 'COPY', 'RCPY', 'PAIR', 'PSUS', 'PSUE']);
        } else {
            if (rand === 0) {
                result.status = _.sample(['SMPL', 'COPY', 'RCPY', 'PAIR', 'PSUS', 'PSUE']);
            } else {
                result = null;
            }
        }
        return result;
    };

    var generateMockReplicationGroupsSummary = function () {
      return {
          replicationGroupCountByType: [
              {
                  replicationType: 'CLONE',
                  count: 2
              },
              {
                  replicationType: 'SNAPSHOT',
                  count: 2
              }
          ]
      };
    };

    var handleGetRequest = function (urlResult) {
        _.forEach(replicationGroups, function(rg) {
            rg.storageSystemId = urlResult.resourceId + '';
        });

        _.forEach(affectedVolumePairs, function (avp) {
            if (urlResult.subResourceId) {
                avp.replicationGroup = 'Replication Group' + urlResult.subResourceId;
            }
            avp.primaryVolume.storageSystemId = urlResult.resourceId + '';
            if (avp.secondaryVolume) {
                avp.secondaryVolume.storageSystemId = urlResult.resourceId + '';
            }
        });

        if (urlResult.subResourceId === 'summary') {
            return mockUtils.response.ok(generateMockReplicationGroupsSummary());
        }
        if (urlResult.subSubType === 'affected-volume-pairs') {
            return mockUtils.response.ok({volumePairs: affectedVolumePairs});
        }

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(replicationGroups));
    };


    return {
        init: function () {
            generateMockReplicationGroups();
            generateMockAffectedVolumePairs();
        },
        getMock: function () {
            return replicationGroups;
        },
        handle: function (urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return handleGetRequest(urlResult);
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});