/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

rainierAppMock.factory('volumeManagerMock', function (mockUtils, commonMock) {
    var pathResoruce = function () {
        return {
            portId: 'CL1-A',
            hostMode: 'LINUX',
            hostModeOptions: [999]
        };
    };

    var iscsiPathResource = function () {
        return _.assign({
            iscsiInitiatorName: commonMock.getIscsiName()
        }, pathResoruce());
    };

    var fibrePathResource = function () {
        return _.assign({
            serverWwn: commonMock.getWwn()
        }, pathResoruce());
    };

    var result = function () {
        var pathResources = _.chain(_.range(0,9))
            .map(function () {return _.sample([true, false]);})
            .map(function (iscsi) {return iscsi ? iscsiPathResource() : fibrePathResource();})
            .value();

        return {
            pathResources: pathResources
        };
    };

    var previrtualizeResult = function () {
        return {
            jobId: 'preVirtualize',
            status: _.sample(['IN_PROGRESS', 'SUCCESS', 'FAILURE'])
        };
    };

    var shredResult = function () {
        return {
            jobId: 'shredding',
            status: _.sample(['IN_PROGRESS', 'SUCCESS', 'FAILURE'])
        };
    };

    var handler = function (urlResource) {
        if(urlResource.action === 'auto-path-select') {
            return result();
        }
        if(urlResource.action === 'pre-virtualize') {
            return previrtualizeResult();
        }
        if (urlResource.action === 'shred') {
            return shredResult();
        }
        return [];
    };

    return {
        handle: function (urlResource) {
            return mockUtils.response.ok(handler(urlResource));
        }
    };
});
