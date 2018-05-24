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
        SNAP: 'Snap',
        SNAP_ON_SNAP: 'Snap on Snap',
        SNAP_CLONE: 'Snap Clone'
    };
    var rawTypeConst = {
        CLONE: 'CLONE',
        SNAP: 'SNAP',
        SNAP_ON_SNAP: 'SNAP_ON_SNAP',
        SNAP_CLONE: 'SNAP_CLONE'
    };
    var tooltip = {
        CLONE: function () {
            return synchronousTranslateService.translate('clone-tooltip');
        },
        SNAP: function () {
            return synchronousTranslateService.translate('snap-tooltip');
        },
        SNAP_ON_SNAP: function () {
            return synchronousTranslateService.translate('snap-on-snap-tooltip');
        },
        SNAP_CLONE: function () {
            return synchronousTranslateService.translate('snap-clone-tooltip');
        }
    };
    var rawToTooltip = function (raw) {
        return tooltip[raw]();
    };
    var rawToDisp = function (type) {
        switch (type) {
            case rawTypeConst.CLONE:
                return dispTypeConst.CLONE;
            case rawTypeConst.SNAP:
                return dispTypeConst.SNAP;
            case rawTypeConst.SNAP_ON_SNAP:
                return dispTypeConst.SNAP_ON_SNAP;
            case rawTypeConst.SNAP_CLONE:
                return dispTypeConst.SNAP_CLONE;
            default:
                return type.charAt(0).toUpperCase() + type.toLowerCase().slice(1);
        }
    };
    var dispToRaw = function (type) {
        switch (type) {
            case dispTypeConst.CLONE:
                return rawTypeConst.CLONE;
            case dispTypeConst.SNAP:
                return rawTypeConst.SNAP;
            case dispTypeConst.SNAP_ON_SNAP:
                return rawTypeConst.SNAP_ON_SNAP;
            case dispTypeConst.SNAP_CLONE:
                return rawTypeConst.SNAP_CLONE;
            default:
                return type !== 'GAD' ? type.toString().toUpperCase() : type;
        }
    };
    return {
        GadDevice: function GadDevice() {
            this.volumeId = 'N/A';
            this.displayVolumeId = 'N/A';
            this.storageSystemId = 'N/A';
            this.ioMode = 'N/A';
            this.state = 'N/A';
            this.pairSuspendStatus = 'N/A';
            this.targetStorageSystemId = 'N/A';
            this.targetModel = 'N/A';
            this.targetVolumeId = 'N/A';
            this.targetLunNumber = 'N/A';
            this.type = 'N/A';
            this.status = 'N/A';
            this.pairCreationTime = 'N/A';
            this.quorumId = 'N/A';
        },
        displayReplicationTypes: function (rawType, gadSummary) {
            var displayTypes = [];

            _.each(rawType, function (type) {
                displayTypes.push(rawToDisp(type));
            });

            // For GAD, there's no difference between raw type and display type, so no need to update rawToDisp() and dispToRaw()
            if (gadSummary && _.find([synchronousTranslateService.translate('gad-display-type'),
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
        isSnap: function (type) {
            return type === dispTypeConst.SNAP ||
                type === rawTypeConst.SNAP;
        },
        isSnapOnSnap: function (type) {
            return type === dispTypeConst.SNAP_ON_SNAP ||
                type === rawTypeConst.SNAP_ON_SNAP;
        },
        isSnapClone: function (type) {
            return type === dispTypeConst.SNAP_CLONE ||
                type === rawTypeConst.SNAP_CLONE;
        },
        isSnapShotType: function (type) {
            return type === dispTypeConst.SNAP ||
                type === rawTypeConst.SNAP ||
                type === dispTypeConst.SNAP_ON_SNAP ||
                type === rawTypeConst.SNAP_ON_SNAP;
        },
        tooltip: function (type) {
            var tooltip = rawToTooltip(dispToRaw(type));
            if (tooltip) {
                return tooltip;
            } else {
                return type;
            }
        }

    };
});