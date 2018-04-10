'use strict';

rainierAppMock.factory('externalVolumesMock', function(mockUtils) {
    var externalVolume = function(id) {
        return {
            volumeId: id,
            size: _.random(1, Math.pow(1024, 4)),
            mappedLdevId: _.sample(['9' + id, undefined]),
            migrationSummary: _.sample([undefined, {
                migrationType: 'NONE'
            }]),
            storageSystemId: '999999',
            externalParityGroupId: _.sample([
                undefined,
                _.random(1,10) + '-' + _.random(1,10)
            ])
        };
    };

    var externalVolumes = _.chain(new Array(100))
        .map(function(v, i) { return externalVolume(i); })
        .value();

    var handleGetRequest = function (urlResult){
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
