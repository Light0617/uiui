/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

rainierAppMock.factory('discoverLunMock', function (mockUtils, storagePortsMock) {
    var discoveredLuns = [];

    var generateMockDiscoveredLuns = function () {
        var total = 200;

        while (total-- !== 0) {
            var mockVolume = generateDiscoveredLun(total);
            discoveredLuns.push(mockVolume);
        }
    };

    var wwns = function () {
        var randomLengthArray = _.range(0, _.random(1, 2));
        return _.chain(randomLengthArray).map(storagePortsMock.wwn).value();
    };

    var iscsiTargetInformation = function () {
        var r = {
            ipAddress: "172.17.91.00",
            iscsiName: "iqn.1994-04.jp.co.hitachi:rsd.h8h.t.10011.1d097",
            amd: "CHAP",
            direction: "MUTUAL",
            chapUser: "Win_SQL_EX",
            iscsiVirtualPortId: "CL1-D"
        };
        return r;
    };

    var generateDiscoveredLun = function (l) {
        var iscsi = _.sample([true, false]);
        var v = v = _.random(1, 255);
        var mocksize = mockUtils.getCapacity(100,200);
        return{
            portId: 'CL' + v + '-' + _.sample(['A', 'B']),
            wwn: wwns(),
            lunId: l + ' ',
            capacity: mocksize,
            produceId: "OPEN-V",
            eVolIdC: "HITACHI 50402840004F",
            externalIscsiInformation: iscsi ? iscsiTargetInformation() : undefined,
            isDDM: (mocksize > 4000000000000) ? true : false
        };
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.subResourceId) {
            var luns = mockUtils.listFromCollection(discoveredLuns, urlResult.subResourceId, 'portId');
            return (luns) ? mockUtils.response.ok(luns) : mockUtils.response.notFound('Unable to find volume from matching portId.');
        }

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(volumes));
    };


    return {
        init: function () {
            generateMockDiscoveredLuns();
        },
        getMock: function () {
            return discoveredLuns;
        },
        generateMockDiscoveredLuns: generateMockDiscoveredLuns(),
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