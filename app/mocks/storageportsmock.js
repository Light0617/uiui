/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

rainierAppMock.factory('storagePortsMock', function (mockUtils) {
    function getPortAttribute() {

        var attributesList = [];
        var possibleAttributeValues = ['TARGET_PORT', 'RCU_TARGET_PORT', 'MCU_INITIATOR_PORT', 'EXTERNAL_INITIATOR_PORT'];
        attributesList.push(_.sample(possibleAttributeValues));
        return attributesList;
    }

    var port = function (index) {
        var v = index;
        if (v && v !== 0) {
            v = _.random(1, 10);
        }
        return {
            isVsmPort: _.sample([true, false]),
            storagePortId: 'CL' + v + '-' + _.sample(['A', 'B']),
            storageSystemId: '22001',
            attributes: getPortAttribute(),
            speed: _.sample(['AUTO', '4G']),
            loopId: _.sample(['A', 'B', 'C', 'D', 'E', 'F']) + _.random(1, 9),
            topology: _.sample(['FABRIC_ON_POINT_TO_POINT', 'FABRIC_OFF_POINT_TO_POINT', 'FABRIC_ON_ARB_LOOP', 'FABRIC_OFF_ARB_LOOP']),
            securitySwitchEnabled: _.sample([true, false])
        };
    };

    var iscsiPort = function (index) {
        return Object.assign({
            type: 'ISCSI',
            iscsiPortInformation: iscsiPortInformation()
        }, port(index));
    };

    var iscsiPortInformation = function () {
        var raw = iscsiIPInfo();
        return Object.assign({
            portIscsiName: iscsi()
        }, raw);
    };

    var randomIpv6Address = function() {
        return 'CAEC:CEC6:C4EF:BB7B:1A78:D055:216D:' + _.random(0, 65535).toString(16).toUpperCase();
    };

    var iscsiIPInfo = function () {
        var raw = {
            ipv6Enabled: _.sample([true, false])
        };
        raw.ipv4Information = {
            address: '10.1.91.' + _.random(2, 255),
            subnetMask: '255.255.0.0',
            defaultGateway: '0.0.0.0'
        };
        if (raw.ipv6Enabled) {
            raw.ipv6Information = {
                linklocalAddressingMode: _.sample(['AUTO', 'MANUAL']),
                globalAddressingMode: _.sample(['AUTO', 'MANUAL'])
            };

            if (raw.ipv6Information.linklocalAddressingMode === 'MANUAL') {
                raw.ipv6Information.linklocalAddress = randomIpv6Address();
            }

            if (raw.ipv6Information.globalAddressingMode === 'MANUAL') {
                raw.ipv6Information.globalAddress = randomIpv6Address();
            }
        }

        return raw;
    };

    var fibrePort = function (index) {
        return Object.assign({
            type: 'FIBRE',
            wwn: wwn(),
            securitySwitchEnabled: _.sample([true, false])
        }, port(index));
    };

    var iscsi = function () {
        return 'iqn.1994-04.jp.co.hitachi:rsd.h8h.t.10011.1d097';
    };

    var wwn = function () {
        return _.map(_.range(0, 16), function () {
            return _.random(15).toString(16).toUpperCase();
        }).join('');
    };

    var typeCondition = function (type) {
        return function (e) {
            return _.include(e, type);
        };
    };

    var typeFilter = function (type) {
        return function (e) {
            return e.type === type;
        };
    };

    var handleGetRequest = function (urlResult) {
        if (urlResult.subResourceId) {
            // var storagePort = mockUtils.fromCollection(storagePorts, urlResult.subResourceId, 'id');
            // return (storagePort) ? mockUtils.response.ok(storagePort) : mockUtils.response.notFound('Unable to find endpoint with matching Id.');
            return mockUtils.response.ok(iscsiPort(1));
        }
        if (_.some(urlResult.queryParams, typeCondition('ISCSI'))) {
            var iscsis = _.filter(storagePorts, typeFilter('ISCSI'));
            return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(iscsis, 'storagePorts'));
        }
        if (_.some(urlResult.queryParams, typeCondition('FIBRE'))) {
            var fibres = _.filter(storagePorts, typeFilter('FIBRE'));
            return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(fibres, 'storagePorts'));
        }

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(storagePorts, 'storagePorts'));
    };

    var storagePorts = _.map(_.range(1, 50), function (index) {
        var iscsi = _.sample([true, false]);
        if (iscsi) {
            return iscsiPort(index);
        }
        return fibrePort(index);
    });

    return {
        getMock: function () {
            return storagePorts;
        },
        handle: function (urlResult) {
            switch (urlResult.method) {
                case 'GET':
                    return handleGetRequest(urlResult);
                default:
                    return mockUtils.response.methodNotAllowed(urlResult.url);
            }
        },
        iscsi: iscsi,
        wwn: wwn
    };
});