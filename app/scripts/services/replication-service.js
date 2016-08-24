'use strict';

/**
 * @ngdoc service
 * @name rainierApp.replicationService
 * @description
 * # replicationService
 * Provider in the rainierApp.
 */

angular.module('rainierApp').factory('replicationService', function (synchronousTranslateService) {
    var dispTypeConst = {
        CLONE: 'Clone',
        SNAPSHOT_NONEXTENDABLE: 'Snapshot (Non-Extendable)',
        SNAPSHOT_EXTENDABLE: 'Snapshot (Extendable)',
        SNAPSHOT_FULLCOPY: 'Snapshot (Full Copy)'
    };
    var rawTypeConst = {
        CLONE: 'CLONE',
        SNAPSHOT_NONEXTENDABLE: 'SNAPSHOT',
        SNAPSHOT_EXTENDABLE: 'SNAPSHOT_EXTENDABLE',
        SNAPSHOT_FULLCOPY: 'SNAPSHOT_FULLCOPY'
    };
    var rawToDisp = function (type) {
        switch (type) {
            case rawTypeConst.CLONE:
                return dispTypeConst.CLONE;
            case rawTypeConst.SNAPSHOT_NONEXTENDABLE:
                return dispTypeConst.SNAPSHOT_NONEXTENDABLE;
            case rawTypeConst.SNAPSHOT_EXTENDABLE:
                return dispTypeConst.SNAPSHOT_EXTENDABLE;
            case rawTypeConst.SNAPSHOT_FULLCOPY:
                return dispTypeConst.SNAPSHOT_FULLCOPY;
            default:
                return type.charAt(0).toUpperCase() + type.toLowerCase().slice(1);
        }
    };
    var dispToRaw = function (type) {
        switch (type) {
            case dispTypeConst.CLONE:
                return rawTypeConst.CLONE;
            case dispTypeConst.SNAPSHOT_NONEXTENDABLE:
                return rawTypeConst.SNAPSHOT_NONEXTENDABLE;
            case dispTypeConst.SNAPSHOT_EXTENDABLE:
                return rawTypeConst.SNAPSHOT_EXTENDABLE;
            case dispTypeConst.SNAPSHOT_FULLCOPY:
                return rawTypeConst.SNAPSHOT_FULLCOPY;
            default:
                return type.toString().toUpperCase();
        }
    };
    return {
        displayReplicationTypes: function (rawType, gadSummary) {
            var displayTypes = [];

            _.each(rawType, function (type) {
                displayTypes.push(rawToDisp(type));
            });

            // For GAD, there's no difference between raw type and display type, so no need to update rawToDisp() and dispToRaw()
            if(gadSummary && _.find([synchronousTranslateService.translate('gad-display-type'),
                    synchronousTranslateService.translate('gad-display-type')], function (validGadType) {
                        return validGadType === gadSummary.volumeType;
                    }) !== undefined) {
                displayTypes.push(synchronousTranslateService.translate('gad-display-type'));
            }
            return displayTypes.join(', ');
        },
        displayReplicationType: rawToDisp,
        rawReplicationType: dispToRaw,
        dispTypes: dispTypeConst,
        rawTypes: rawTypeConst,
        isClone: function (type) {
            return type === dispTypeConst.CLONE || type === rawTypeConst.CLONE;
        },
        isSnapshotNonExtendable: function (type) {
            return type === dispTypeConst.SNAPSHOT_NONEXTENDABLE ||
                type === rawTypeConst.SNAPSHOT_NONEXTENDABLE;
        },
        isSnapshotExtendable: function (type) {
            return type === dispTypeConst.SNAPSHOT_EXTENDABLE ||
                type === rawTypeConst.SNAPSHOT_EXTENDABLE;
        },
        isSnapshotFullcopy: function (type) {
            return type === dispTypeConst.SNAPSHOT_FULLCOPY ||
                type === rawTypeConst.SNAPSHOT_FULLCOPY;
        }
    };
});