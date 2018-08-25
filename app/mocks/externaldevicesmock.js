'use strict';

rainierAppMock.factory('externalDevicesMock', function (mockUtils) {

    var externalPaths = function (i) {
        return _.map(new Array(_.random(1, 3)).fill(0), function () {
            return {
                portId: _.sample(['CL1-A', 'CL2-B', 'CL3-A']),
                externalWwn: '50060E80124F770' + i % 10,
                externalLun: _.random(1,10)
            };
        });
    };

    var externalDevices = _.map(new Array(5).fill(0), function (v, i) {
        var vendor = _.sample(['HITACHI', 'NETAPP', 'EMC', 'PURE']);
        return {
            externalDeviceId: vendor + ' ' + _.random(100000, 999999),
            size: _.random(10000, 100000000000),
            externalStorageSystemInformation: {
                serialNumber: _.random(100000, 1000000),
                vendorId: vendor,
                productId: _.sample(['X ', 'V ', 'C ']) + _.random(100, 10000)
            },
            externalPaths: externalPaths(i),
            mapped: _.sample([true, false])
        };

    });

    var handleGetRequest = function (urlResult) {
        _.each(externalDevices, function (volume) {
            volume.storageSystemId = urlResult.resourceId + '';
        });

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(externalDevices));
    };

    return {
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
