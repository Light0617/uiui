'use strict';

rainierAppMock.factory('storagePortsMock', function(mockUtils) {
    function getPortAttribute() {

        var attributesList = [];
        var possibleAttributeValues = ['TARGET_PORT', 'RCU_TARGET_PORT', 'MCU_INITIATOR_PORT', 'EXTERNAL_INITIATOR_PORT'];
        attributesList.push(_.sample(possibleAttributeValues));
        return attributesList;
    }
    
    var storagePorts = _.union(
        [{
            storagePortId: 'CL1-C',
            storageSystemId: '22001',
            wwn: '50060e8007c380000',
            attributes: ['TARGET_PORT'],
            speed: _.sample(['AUTO', '4G']),
            type: 'FIBRE',
            loopId: 'G9',
            topology: _.sample(['FABRIC_ON_POINT_TO_POINT','FABRIC_OFF_POINT_TO_POINT','FABRIC_ON_ARB_LOOP','FABRIC_OFF_ARB_LOOP']),
            securitySwitchEnabled: _.sample([true, false])
        }],
        _.map(_.range(1, 50), function (v) {

            var pad = '00';
            v += '';
            var wwn = '50060e8007c38' + pad.substring(0, pad.length - v.length) + v;

            return {
                storagePortId: 'CL' + v + '-' + _.sample(['A', 'B']),
                storageSystemId: '22001',
                wwn: wwn,
                attributes: getPortAttribute(),
                speed: _.sample(['AUTO', '4G']),
                type: _.sample(['ENAS', 'ESCON', 'FCOE', 'FIBRE', 'FICON', 'ISCSI', 'SCSI']),
                loopId: _.sample(['A', 'B', 'C', 'D', 'E', 'F']) + _.random(1, 9),
                topology: _.sample(['FABRIC_ON_POINT_TO_POINT','FABRIC_OFF_POINT_TO_POINT','FABRIC_ON_ARB_LOOP','FABRIC_OFF_ARB_LOOP']),
                securitySwitchEnabled: _.sample([true, false])
            };
        }));

    var handleGetRequest = function (urlResult){
        if (urlResult.subResourceId) {
            var storagePort = mockUtils.fromCollection(storagePorts, urlResult.subResourceId, 'id');
            return (storagePort) ? mockUtils.response.ok(storagePort) : mockUtils.response.notFound('Unable to find endpoint with matching Id.');
        }

        return mockUtils.response.ok(mockUtils.singlePageCollectionResponse(storagePorts, 'storagePorts'));
    };

    return {
        getMock: function() {
            return storagePorts;
        },
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