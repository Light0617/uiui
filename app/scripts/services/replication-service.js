'use strict';

/**
 * @ngdoc service
 * @name rainierApp.replicationService
 * @description
 * # replicationService
 * Provider in the rainierApp.
 */

angular.module('rainierApp').factory('replicationService', function () {
    var transformReplicationType = function (type) {
        switch (type) {
            case 'CLONE':
                return 'Clone';
            case 'SNAPSHOT':
                return 'Snapshot(Non-Extendable)';
            case 'SNAPSHOT_FULLCOPY':
                return 'Snapshot(Full Copy)';
            case 'SNAPSHOT_EXTENDABLE':
                return 'Snapshot(Extendable)';
            default:
                return type.charAt(0).toUpperCase() + type.toLowerCase().slice(1);
        }
    };
    return {
        displayReplicationType: function (rawType) {
            var displayTypes = [];
            _.each(rawType, function (type) {
                displayTypes.push(transformReplicationType(type));
            });
            return displayTypes.join(', ');
        }
    };
});