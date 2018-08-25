'use strict';

rainierAppMock.factory('volumepairmock', function (mockUtils) {
    var volumepairs = [];

    var generateMockVolumePairs = function () {
        var total = 5;

        while (total-- !== 0) {
            var mockVolumePair = generateVolumePair(total);
            volumepairs.push(mockVolumePair);
        }
    };

    var generateVolumePair = function (v) {
        return {
            replicationGroup: _.sample(['Replication Group' + v, null]),
            volumePairGroup: _.sample(['SnapshotGroup' + v, 'CloneGroup' + v]),
            mirrorId: _.random(1, 20),
            splitTime: 1450814584000,
            consistent: _.sample([true, false]),
            consistencyId: _.random(1, 100),
            type: _.sample(['SNAP', 'CLONE', 'SNAP_ON_SNAP', 'SNAP_CLONE']),
            primaryVolume: getVolume('p-vol'),
            secondaryVolume: getVolume('s-vol'),
            state: _.sample(['HEALTHY', 'ERROR'])
        };
    };

    var getVolume = function (volume) {
        var rand = _.random(0, 1);
        var result = {
            id: _.random(1, 200)
        };
        if (volume === 'p-vol') {
            result.status = _.sample(['SMPL', 'COPY', 'RCPY', 'PAIR', 'PSUS', 'PSUE']);
        } else {
            if (rand === 0) {
                result.status = _.sample(['SMPL', 'COPY', 'RCPY', 'PAIR', 'PSUS', 'PSUE', 'SMPP', 'PSUP']);
            } else {
                result = null;
            }
        }
        return result;
    };

    var handleGetRequest = function (urlResult) {
        _.forEach(volumepairs, function (vp) {
            if (urlResult.subResourceId) {
                vp.replicationGroup = 'Replication Group' + urlResult.subResourceId;
            }
            vp.primaryVolume.storageSystemId = urlResult.resourceId + '';
            if (vp.secondaryVolume) {
                vp.secondaryVolume.storageSystemId = urlResult.resourceId + '';
            }
        });

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(volumepairs));
    };


    return {
        init: function () {
            generateMockVolumePairs();
        },
        getMock: function () {
            return volumepairs;
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