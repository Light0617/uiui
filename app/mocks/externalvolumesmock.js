'use strict';

rainierAppMock.factory('externalVolumesMock', function(mockUtils) {
    var externalVolume = function(id) {
        return {
            mappedLdevId: id,
            externalParityGroupId: _.random(1,10) + '-' + _.random(1,10),
            usedCapacity: _.random(1,1024 ^ 4),
            availableCapacity: _.random(1,1024 ^ 4)
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
