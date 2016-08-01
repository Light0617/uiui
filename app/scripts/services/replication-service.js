'use strict';

/**
 * @ngdoc service
 * @name rainierApp.replicationService
 * @description
 * # replicationService
 * Provider in the rainierApp.
 */

angular.module('rainierApp').factory('replicationService', function () {
    var rawToDisp = function (type) {
        switch (type) {
            case 'CLONE':
                return 'Clone';
            case 'SNAPSHOT':
                return 'Snapshot (Non-Extendable)';
            case 'SNAPSHOT_FULLCOPY':
                return 'Snapshot (Full Copy)';
            case 'SNAPSHOT_EXTENDABLE':
                return 'Snapshot (Extendable)';
            default:
                return type.charAt(0).toUpperCase() + type.toLowerCase().slice(1);
        }
    };
    var dispToRaw = function (type) {
        switch (type) {
            case 'Clone':
                return 'CLONE';
            case 'Snapshot (Non-Extendable)':
                return 'SNAPSHOT';
            case 'Snapshot (Extendable)':
                return 'SNAPSHOT_EXTENDABLE';
            case 'Snapshot (Full Copy)':
                return 'SNAPSHOT_FULLCOPY';
            default:
                return type.toString().toUpperCase();
        }
    };
    return {
        displayReplicationTypes: function (rawType) {
            var displayTypes = [];
            _.each(rawType, function (type) {
                displayTypes.push(rawToDisp(type));
            });
            return displayTypes.join(', ');
        },
        displayReplicationType: rawToDisp,
        rawReplicationType: dispToRaw
    };
});