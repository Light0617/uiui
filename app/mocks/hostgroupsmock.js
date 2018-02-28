/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

rainierAppMock.factory('hostGroupsMock', function (mockUtils, commonMock) {
    var hostGroup = function () {
        return {
            storagePortId: 'CL4-G',
            storageSystemId: '410013',
            hostMode: 'LINUX',
            hostModeOptions: [999],
            luns: _.chain(_.range(0, 199)).map(function (v, i) {
                return {lun: i, volumeId: v};
            }).value()
        };
    };

    var fibreHostGroup = function () {
        return _.assign({
            protocol: 'FIBRE',
            hbaWwns: commonMock.getWwns()
        }, hostGroup());
    };

    var iscsiHostGroup = function () {
        return _.assign({
            protocol: 'ISCSI',
            iscsiTargetInformation: {
                iscsiInitiatorNames: commonMock.getIscsiNames()
            }
        }, hostGroup());
    };

    var hostGroups = function () {
        return _.chain(_.range(0,10))
            .map(function() {return _.sample([true, false]);})
            .map(function(iscsi) {return iscsi ? iscsiHostGroup() : fibreHostGroup();})
            .value();
    };

    var randomHostGroups = hostGroups();

    return {
        getMock: function () {
            return [];
        },
        handle: function () {
            return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(randomHostGroups));
        }
    };
});
