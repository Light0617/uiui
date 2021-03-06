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
        var defaultOsType = ['WIN_EX', 'VMWARE_EX'];
        var defaultHostModeWithHostModeOptionMap = {};
        defaultHostModeWithHostModeOptionMap[defaultOsType[0]] = [40,73];
        defaultHostModeWithHostModeOptionMap[defaultOsType[1]] = [54,63];
        var isR800SeriesFunc = function (storageModel) {
            return storageModel === this.storageModel.Rx00.G1000 ||
                storageModel === this.storageModel.Rx00.G1500 ||
                storageModel === this.storageModel.Rx00.F1500;
        };
        var isRaidSeriesFunc = function (storageModel) {
            return isR800SeriesFunc.call(this, storageModel);
        };
        var previrtualizeJobStatus = {
            inprogress: 'IN_PROGRESS',
            success: 'SUCCESS',
            failed: 'FAILED'
            // SUCCESS WITH ERRORS are not exists in previrtualize
        };

        return {
            osType: function () {
                return ['HP_UX', 'SOLARIS', 'AIX', 'WIN', 'LINUX', 'TRU64', 'OVMS', 'NETWARE', 'VMWARE', 'VMWARE_EX', 'WIN_EX'];
            },
            defaultHostModeWithHostModeOptions: defaultHostModeWithHostModeOptionMap,
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
            virtualModelOptions: function () {
              return ['VSP_F900','VSP_G900','VSP_F700','VSP_G700','VSP_F370','VSP_G370','VSP_F350','VSP_G350','VSP_F400_F600_AND_VSP_G400_G600','VSP_G200','HUS_VM','VSP_F1500_AND_VSP_G1000_G1500','VSP','USP_VM','USP_V','NSC','USP'];
            },
            isR800Series: isR800SeriesFunc,
            isRaidSeries: isRaidSeriesFunc,
            previrtualizeJobStatus: previrtualizeJobStatus,
            isHM800Series: function (storageModel) {
                return storageModel === this.storageModel.HM800.G100 ||
                    storageModel === this.storageModel.HM800.G200 ||
                    storageModel === this.storageModel.HM800.G400 ||
                    storageModel === this.storageModel.HM800.G600 ||
                    storageModel === this.storageModel.HM800.G800 ||
                    storageModel === this.storageModel.HM800.F400 ||
                    storageModel === this.storageModel.HM800.F600 ||
                    storageModel === this.storageModel.HM800.F800;
            },
            isHM850Series: function (storageModel) {
                return storageModel === this.storageModel.HM850.G130 ||
                    storageModel === this.storageModel.HM850.G350 ||
                    storageModel === this.storageModel.HM850.G370 ||
                    storageModel === this.storageModel.HM850.G700 ||
                    storageModel === this.storageModel.HM850.G900 ||
                    storageModel === this.storageModel.HM850.F350 ||
                    storageModel === this.storageModel.HM850.F370 ||
                    storageModel === this.storageModel.HM850.F700 ||
                    storageModel === this.storageModel.HM850.F900;
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
            volumeType: {
                HDP: 'HDP',
                HDT: 'HDT',
                HTI: 'HTI',
                GAD: 'GAD',
                EXTERNAL: 'EXTERNAL'
            },
            volumeStatus: {
                NORMAL: 'NORMAL',
                BLOCKED: 'BLOCKED',
                BUSY: 'BUSY',
                SHREDDING: 'SHREDDING',
                NONE: 'NONE',
                UNKNOWN: 'UNKNOWN'
            },
            tieringMode:{
                NONE: 'NONE',
                MANUAL: 'MANUAL',
                AUTOMATIC: 'AUTOMATIC'
            },
            gadVolumeType: {
                NOT_AVAILABLE: 'NOT_AVAILABLE',
                ACTIVE_PRIMARY: 'ACTIVE_PRIMARY',
                ACTIVE_SECONDARY: 'ACTIVE_SECONDARY'
            },
            migrationType: {
                NONE: 'NONE',
                MIGRATION: 'MIGRATION'
            },
            storageModel: {
                HM800: {
                    G100: 'VSP G100',
                    G200: 'VSP G200',
                    G400: 'VSP G400',
                    G600: 'VSP G600',
                    G800: 'VSP G800',
                    F400: 'VSP F400',
                    F600: 'VSP F600',
                    F800: 'VSP F800'
                },
                HM850: {
                    G130: 'VSP G130',
                    G350: 'VSP G350',
                    G370: 'VSP G370',
                    G700: 'VSP G700',
                    G900: 'VSP G900',
                    F350: 'VSP F350',
                    F370: 'VSP F370',
                    F700: 'VSP F700',
                    F900: 'VSP F900'
                },
                Rx00: {
                    G1000: 'VSP G1000',
                    G1500: 'VSP G1500',
                    F1500: 'VSP F1500'
                }
            },
            yes: 'YES',
            no: 'NO',
            notAvailable: 'N/A',
            prefixReservedStoragePool: 'HSA-reserved',
            poolStatus: {
                NORMAL: 'NORMAL',
                FULL: 'FULL',
                SUSPENDED: 'SUSPENDED',
                FAILED: 'FAILED'
            },
            migrationTaskStatus: {
                SCHEDULED: 'SCHEDULED',
                IN_PROGRESS: 'IN_PROGRESS',
                SUCCESS: 'SUCCESS',
                FAILED: 'FAILED',
                SUCCESS_WITH_ERRORS: 'SUCCESS_WITH_ERRORS'
            },
            dataProtectionCoverage: {
                PROTECTED: 'PROTECTED',
                PARTIAL: 'PARTIAL',
                UNPROTECTED: 'UNPROTECTED'
            },
            CALCULATED: 'CALCULATED',
            CALCULATION_IN_PROGRESS: 'CALCULATION_IN_PROGRESS',
            CALCULATED_WITH_EXCEEDED: 'CALCULATED_WITH_EXCEEDED',
            HYPHEN: '-',
            CAPACITY_FILTER_DEFAULT_CONDITION: function () {
                return angular.copy({
                    min: 0,
                    max: 1000,
                    unit: 'PiB'
                });
            }
        };
    });
