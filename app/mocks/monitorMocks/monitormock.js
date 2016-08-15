'use strict';

rainierAppMock.factory('monitorMock', function () {

    var resTypes = ['Battery', 'Fan', 'Cache', 'Processor', 'Port', 'Memory', 'PowerSupply'];
    var capResType = ['Pool'];
    var alertLevels = ['critical', 'warning', 'ok', 'unknown'];
    var hardwareAlert = _.flatten(_.map(_.range(1, 65), function (v) {
        var now = new Date();
        return _.map(_.range(0, 7), function (i) {
            return {
                alertLevel: alertLevels[_.random(0, 1)],
                storageSerialNumber: '2200' + v,
                storageNickname: 'VSP G400',
                refCode: 'AF5201',
                resourceType: resTypes[i],
                resourceId: '007',
                timestamp: now.toTimeString(),
                description: resTypes[i] + ' warning'
            };
        });
    }));

    var diskAlert = _.map(_.range(1, 65), function (v) {
        var now = new Date();
        return {
            alertLevel: alertLevels[_.random(0, 1)],
            storageSerialNumber: '2200' + v,
            storageNickname: 'VSP G400',
            refCode: 'DF5201',
            resourceType: 'Disk',
            resourceId: '005',
            resourceLocation: 'CDEV - RDEV',
            diskSpec: { diskType:  _.sample(['SSD', 'FMC', 'FMD', 'SAS']), speed: 1500, capacity: getCapacity(0, 5)},
            date: now.toUTCString(),
            timestamp: now.toTimeString(),
            description: 'Disk warning'
        };
    });

    var capacityAlert = _.flatten(_.map(_.range(1, 65), function (v) {
        var now = new Date();
        return _.map(_.range(0, 1), function () {
            return {
                alertLevel: alertLevels[_.random(0, 1)],
                storageSerialNumber: '2200' + v,
                storageNickname: 'VSP G400',
                refCode: 'CF5201',
                resourceType: capResType[0],
                resourceId: '7',
                date: now.toUTCString(),
                timestamp: now.toTimeString(),
                description: capResType[0] + ' warning'
            };
        });
    }));

    function getCapacity(min, max) {
        return _.random(min, max) * Math.pow(1024, 4) + '';
    }

    return  {
        hardwareAlert: hardwareAlert,
        capacityAlert: capacityAlert,
        diskAlert: diskAlert
    };
});