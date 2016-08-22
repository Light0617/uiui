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
            }
        };
    });
