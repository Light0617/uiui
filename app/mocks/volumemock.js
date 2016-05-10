'use strict';

rainierAppMock.factory('volumeMock', function (mockUtils) {
    var volumes = [];

    var generateMockVolumes = function () {
        var total = 200;

        while (total-- !== 0) {
            var mockVolume = generateMockVolume(total);
            volumes.push(mockVolume);
        }
    };

    var generateMockVolume = function (v) {
        return {
            volumeId: v + '',
            storageSystemId: 'REPLACE',
            poolId: '001',
            label: 'Volume' + v,
            size: mockUtils.getCapacity(100, 200),
            usedCapacity: mockUtils.getCapacity(10, 25),
            availableCapacity: mockUtils.getCapacity(50, 75),
            status: _.sample(['Normal', 'Blocked', 'Busy', 'Unknown']),
            type: _.sample(['HDP', 'HDT', 'HTI']),
            dataProtectionSummary: getVolumeDataProtectionSummary()
        };
    };

    var getReplicationGroupIdMap = function () {
        var rand = _.random(1, 2);
        var map = {};
        for (var j = 0; j <= 9; j++) {
            map[[_.random(1000, 2000)]] = 'RG name ' + j.toString();
        }
        if (rand === 1) {
            return null;
        }
        return map;
    };

    var getVolumeDataProtectionSummary = function getVolumeDataProtectionSummary() {
        return {
            replicationType: _.sample([['CLONE'], ['SNAPSHOT'], ['CLONE', 'SNAPSHOT'], []]),
            volumeType: _.sample([['P-VOL'], ['S-VOL'], ['UNPROTECTED'], ['P-VOL', 'S-VOL']]),
            replicationGroupIdMap: getReplicationGroupIdMap(),
            hasFailures: _.sample([true, false, false, false]),
            secondaryVolumeCount: 17,
            secondaryVolumeFailures: 13
        };
    };

    var handleGetRequest = function (urlResult) {
        _.each(volumes, function(volume) {
            volume.storageSystemId = urlResult.resourceId + '';
        });
        if (urlResult.subResourceId) {
            var volume = mockUtils.fromCollection(volumes, urlResult.subResourceId, 'volumeId');
            return (volume) ? mockUtils.response.ok(volume) : mockUtils.response.notFound('Unable to find volume with matching Id.');
        }

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(volumes));
    };


    return {
        init: function () {
            generateMockVolumes();
        },
        getMock: function () {
            return volumes;
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