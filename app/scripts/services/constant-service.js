'use strict';

/**
 * @ngdoc service
 * @name rainierApp.constantService
 * @description
 * # constantService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('constantService', function () {
        return {
            osType: function () {
                return ['HP_UX', 'SOLARIS', 'AIX', 'WIN', 'LINUX', 'TRU64', 'OVMS', 'NETWARE', 'VMWARE', 'VMWARE_EX', 'WIN_EX'];
            },
            switchTypes: function () {
                return ['BROCADE', 'CISCO'];
            },
            defaultPrincipalSwitchPortNumber: function () {
                return '22';
            },
            authProtocols: function () {
                return ['NO_AUTH', 'MD5', 'SHA'];
            },
            privacyProtocols: function () {
                return ['NO_PRIV', 'DES', 'TRIPLE_DES', 'AES_128'];
            },
            hostModeOptions: function () {
                return [999, 2, 6, 7, 12, 13, 14, 15, 22, 23, 25, 33, 39, 40, 41, 43, 49, 50, 51, 54, 60, 63, 67, 68, 71, 72, 73, 78, 80, 81, 82, 83, 96, 97, 100, 102];
            },
            isR800Series: function (storageModel) {
                if (storageModel === this.storageModel.VSP_G1000 ||
                    storageModel === this.storageModel.VSP_G1500 ||
                    storageModel === this.storageModel.VSP_F1500) {
                    return true;
                } else {
                    return false;
                }
            },
            isHM800Series: function (storageModel) {
                if (storageModel === this.storageModel.VSP_G100 ||
                    storageModel === this.storageModel.VPS_G200 ||
                    storageModel === this.storageModel.VPS_G400 ||
                    storageModel === this.storageModel.VSP_G600 ||
                    storageModel === this.storageModel.VSP_G800 ||
                    storageModel === this.storageModel.VSP_F400 ||
                    storageModel === this.storageModel.VSP_F600 ||
                    storageModel === this.storageModel.VSP_F800) {
                    return true;
                } else {
                    return false;
                }
            },
            sessionScope: {
                ENCRYPTION_KEYS: 'ENCRYPTION_KEYS',
                PARITY_GROUPS: 'PARITY-GROUPS',
                POOLS: 'POOLS',
                VOLUMES: 'VOLUMES',
                PORTS: 'PORTS',
                LOCAL_REPLICATION_GROUPS: 'LOCAL-REPLICATION-GROUPS',
                REMOTE_REPLICATION_GROUPS: 'REMOTE-REPLICATION-GROUPS'
            },
            poolType: {
                HDP: 'HDP',
                HDT: 'HDT',
                HTI: 'HTI'
            },
            tieringMode:{
                NONE: 'NONE',
                MANUAL: 'MANUAL',
                AUTOMATIC: 'AUTOMATIC'
            },
            storageModel: {
                VSP_G100: 'VSP G100',
                VPS_G200: 'VSP G200',
                VPS_G400: 'VSP G400',
                VSP_G600: 'VSP G600',
                VSP_G800: 'VSP G800',
                VSP_F400: 'VSP F400',
                VSP_F600: 'VSP F600',
                VSP_F800: 'VSP F800',
                VSP_G1000: 'VSP G1000',
                VSP_G1500: 'VSP G1500',
                VSP_F1500: 'VSP F1500'
            },
            yes: 'YES',
            no: 'NO'
        };
    });
