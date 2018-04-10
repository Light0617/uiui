'use strict';

rainierAppMock.factory('externalVolumesMock', function(mockUtils) {
    var externalVolume = function(id) {
        var capacity = _.random(1, Math.pow(1024, 4));
        var usedCapacity = _.random(0, capacity);
        return {
            volumeId: id,
            size: capacity,
            usedCapacity: usedCapacity,
            availableCapacity: capacity - usedCapacity,
            mappedVolumeId: _.sample(['9' + id, undefined]),
            migrationSummary: _.sample([{}, {
                migrationType: 'NONE'
            }, {
                ownerTaskId: '14' + id,
                migrationType: 'MIGRATION'
            }, {
                ownerTaskId: '14' + id,
                migrationType: 'NONE'
            }, {
                migrationType: 'MIGRATION'
            }]),
            storageSystemId: '999999',
            provisioningStatus: _.sample(['ATTACHED', 'UNATTACHED', 'UNMANAGED']),
            type: 'EXTERNAL',
            status: _.sample(['NORMAL', 'BLOCKED', 'BUSY', 'UNKNOWN', 'NONE']),
            externalParityGroupId: _.sample([
                undefined,
                _.random(1,10) + '-' + _.random(1,10)
            ])
        };
    };

    var externalVolumes = _.chain(new Array(100))
        .map(function(v, i) { return externalVolume(i); })
        .value();

    var handleGetRequest = function (urlResult) {
        _.each(externalVolumes, function (volume) {
            volume.storageSystemId = urlResult.resourceId + '';
        });
//        if (urlResult.subResourceId === 'summary') {
//            return mockUtils.response.ok(volumeSummaryMock);
//        }
//        else
        if (urlResult.subResourceId) {
            var volume = mockUtils.fromCollection(externalVolumes, Number(urlResult.subResourceId), 'volumeId');
            return (volume) ? mockUtils.response.ok(volume) : mockUtils.response.notFound('Unable to find volume with matching Id.');
        }

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(externalVolumes));
    };

    return {
        handle: function(urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return handleGetRequest(urlResult);
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        }
    };
});
