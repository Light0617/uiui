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
