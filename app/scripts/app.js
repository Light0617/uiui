'use strict';

/**
 * @ngdoc overview
 * @name rainierApp
 * @description
 * # rainierApp
 *
 * Main module of the application.
 */
angular

    .module('rainierApp', [
        'ngResource',
        'ngRoute',
        'bel-services',
        'restangular',
        'ui.bootstrap',
        'pascalprecht.translate',
        'infinite-scroll',
        'angularFileUpload',
        'helpuiModule',
        'helpuiContentModule',
        'mgcrea.ngStrap.tooltip',
        'mgcrea.ngStrap.popover',
        'mgcrea.ngStrap.timepicker',
        'grizzly',
        'config'
    ])
    .config(function ($routeProvider, $httpProvider, $locationProvider, $translateProvider, $logProvider, RestangularProvider, authServiceProvider, $compileProvider, ENV) {
        $logProvider.debugEnabled(ENV.debug);

        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|blob):/);

        $translateProvider.useStaticFilesLoader({
            prefix: '/i18n/',
            suffix: '.json'
        });
        $translateProvider.preferredLanguage('translation');

        RestangularProvider.setBaseUrl('/v1');
        RestangularProvider.setDefaultHttpFields({timeout: 30 * 1000});
        authServiceProvider.tokenBaseUrl('/v1');
        authServiceProvider.tokenResource('security/tokens');
        authServiceProvider.loginRedirect('/login');
        authServiceProvider.usernameExtractor(function (response) {
            return response.token.user.name.split('@')[0];
        });


        $routeProvider
            .when('/', {
                templateUrl: 'views/dashboard.html',
                controller: 'DashboardCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-dashboard'
                },
                helpContext: 'R_DASHBOARD'
            })
            .when('/hosts', {
                templateUrl: 'views/hosts.html',
                controller: 'HostsCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-hosts'
                },
                helpContext: 'R_HOSTS_INVENTORY'
            })
            .when('/hosts/add', {
                templateUrl: 'views/host-add.html',
                controller: 'HostAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-host-add'
                },
                helpContext: 'T_ADD_HOSTS'
            })
            .when('/hosts/migrate-volumes', {
                templateUrl: 'views/migrate-volumes.html',
                controller: 'MigrateVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'migrate-volumes'
                },
                helpContext: 'T_MIGRATING_VOLUMES'
            })
            .when('/storage-systems/:storageSystemId/volumes/shred-volumes', {
                templateUrl: 'views/shred-volumes.html',
                controller: 'ShredVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'shred-volumes'
                },
                helpContext: 'T_SHREDDING_VOLUMES'
            })
            .when('/storage-systems/:storageSystemId/external-volumes/add', {
                templateUrl: 'views/external-volumes-add.html',
                controller: 'ExternalVolumesAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'Add External Volumes'
                },
                helpContext: 'T_VIRTUALIZING_VOLUMES'
            })
            .when('/hosts/create-and-attach-volumes', {
                templateUrl: 'views/create-and-attach-volumes.html',
                controller: 'CreateAndAttachVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'host-create-attach-protect-volumes'
                },
                helpContext: 'C_CREATE_ATTACH'
            })
            .when('/hosts/attach-volumes', {
                templateUrl: 'views/attach-volume.html',
                controller: 'AttachVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-volume-attach'
                },
                helpContext: 'T_ATTACH_VOLUME'
            })
            .when('/hosts/:hostId', {
                templateUrl: 'views/host.html',
                controller: 'HostCtrl',
                helpContext: 'R_SERVER_DETAILS'
            })
            .when('/hosts/:hostId/update', {
                templateUrl: 'views/host-update.html',
                controller: 'HostUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-host-update'
                },
                helpContext: 'T_UPDATE_HOST'
            })
            .when('/data-protection-monitoring', {
                templateUrl: 'views/data-protection-monitoring.html',
                controller: 'DataProtectionMonitoringCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-data-protection-monitoring'
                },
                helpContext: 'T_MONITORING_DATA_PROTECTION'
            })
            .when('/storage-systems/:storageSystemId/data-protection-monitoring', {
                templateUrl: 'views/data-protection-monitoring.html',
                controller: 'DataProtectionMonitoringCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-data-protection-monitoring'
                },
                helpContext: 'T_MONITORING_DATA_PROTECTION'
            })
            .when('/storage-systems/:storageSystemId/data-protection-monitoring/unprotect', {
                templateUrl: 'views/unprotect-volumes.html',
                controller: 'UnprotectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'unprotect-volume'
                },
                helpContext: 'T_UNPROTECT_VOLUMES'
            })
            .when('/data-protection-monitoring/unprotect', {
                templateUrl: 'views/unprotect-volumes.html',
                controller: 'UnprotectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'unprotect-volume'
                },
                helpContext: 'T_UNPROTECT_VOLUMES'
            })
            .when('/hosts/:hostId/unprotect', {
                templateUrl: 'views/unprotect-volumes.html',
                controller: 'UnprotectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'unprotect-volume'
                },
                helpContext: 'T_UNPROTECT_VOLUMES'
            })
            .when('/storage-systems/:storageSystemId/volumes/volume-actions-restore-selection', {
                templateUrl: 'views/volume-actions-restore-selection.html',
                controller: 'volumeActionsRestoreSelectionCtrl',
                breadcrumbOptions: {
                    labelKey: 'restore-volume'
                },
                //TODO:Help context
                helpContext: ''
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/volumes/volume-actions-restore-selection', {
                templateUrl: 'views/volume-actions-restore-selection.html',
                controller: 'volumeActionsRestoreSelectionCtrl',
                breadcrumbOptions: {
                    labelKey: 'restore-volume'
                },
                //TODO:Help context
                helpContext: ''
            })
            .when('/data-protection-monitoring/volume-actions-restore-selection', {
                templateUrl: 'views/volume-actions-restore-selection.html',
                controller: 'volumeActionsRestoreSelectionCtrl',
                breadcrumbOptions: {
                    labelKey: 'restore-volume'
                },
                //TODO:Help context
                helpContext: ''
            })
            .when('/hosts/:hostId/volume-actions-restore-selection', {
                templateUrl: 'views/volume-actions-restore-selection.html',
                controller: 'volumeActionsRestoreSelectionCtrl',
                breadcrumbOptions: {
                    labelKey: 'restore-volume'
                },
                //TODO:Help context
                helpContext: ''
            })
            .when('/storage-systems/:storageSystemId/data-protection-monitoring/volume-actions-restore-selection', {
                templateUrl: 'views/volume-actions-restore-selection.html',
                controller: 'volumeActionsRestoreSelectionCtrl',
                breadcrumbOptions: {
                    labelKey: 'restore-volume'
                },
                //TODO:Help context'
                helpContext: ''
            })
            .when('/storage-systems/:storageSystemId/replication-groups', {
                templateUrl: 'views/replication-groups.html',
                controller: 'ReplicationGroupsCtrl',
                resolve: {
                    ReplicationGroupSInitialResult: function($route, replicationGroupsService) {
                        var storageSystemId = $route.current.params.storageSystemId;
                        var finalResult = {};
                        return replicationGroupsService.cloneExternalVolumePairExists(storageSystemId).then(function (result) {
                            finalResult.cloneExternalVolumePairExist = result === 0 ? false : true;
                            return replicationGroupsService.snapshotExternalVolumePairExists(storageSystemId);
                        }).then(function (result) {
                            finalResult.snapshotExternalVolumePairExist = result === 0 ? false : true;
                            return replicationGroupsService.snapshotExtendableExternalVolumePairExists(storageSystemId);
                        }).then(function (result) {
                            finalResult.snapshotExtendableExternalVolumePairExist = result === 0 ? false : true;
                            return replicationGroupsService.snapshotFullcopyExternalVolumePairExists(storageSystemId);
                        }).then(function (result) {
                            finalResult.snapshotFullcopyExternalVolumePairExist = result === 0 ? false : true;
                            return finalResult;
                        });
                    }
                },
                breadcrumbOptions: {
                    labelKey: 'common-replication-groups',
                    peers: [
                        'storage-ports',
                        'storage-pools',
                        'volumes',
                        'parity-groups',
                        'external-parity-groups',
                        'external-volumes',
                        'migration-tasks'
                    ]
                },
                helpContext: 'R_REPLICATION_GROUP_INV'
            })
            .when('/storage-systems/:storageSystemId/replication-groups/replication-group-action-confirmation', {
                templateUrl: 'views/replication-group-actions-confirmation.html',
                controller: 'replicationGroupActionsConfirmationCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-replication-group-action-confirmation'
                },
                //TODO:Help context
                helpContext: ''
            })
            .when('/storage-systems/:storageSystemId/replication-groups/edit', {
                templateUrl: 'views/replication-group-edit.html',
                controller: 'replicationGroupEditCtrl',
                breadcrumbOptions: {
                    labelKey: 'action-tooltip-edit-replication-groups'
                },
                helpContext: 'R_REPLICATION_GROUP_EDIT'
            })
            .when('/storage-systems', {
                templateUrl: 'views/storage-systems.html',
                controller: 'StorageSystemsCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-storage-systems'
                },
                helpContext: 'C_STORAGE_SYS_INV'
            })
            .when('/storage-systems/add', {
                templateUrl: 'views/storage-systems-add.html',
                controller: 'StorageSystemsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-systems-add'
                },
                helpContext: 'T_HID_ADD_STORAGE_SYSTEM'
            })
            .when('/storage-systems/:storageSystemId/update', {
                templateUrl: 'views/storage-systems-update.html',
                controller: 'StorageSystemsUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-systems-update'
                },
                helpContext: 'T_UPDATE_STORAGE_SYS'
            })
            .when('/storage-systems/:storageSystemId/settings', {
                templateUrl: 'views/storage-system-settings.html',
                controller: 'StorageSystemSettingsCtrl',
                controllerAs: 'vm',
                breadcrumbOptions: {
                    labelKey: 'storage-system-settings'
                },
                helpContext: 'T_HID_VERIFY_STORAGE_SYSTEM'
            })
            .when('/volume-manager/edit-lun-path', {
                templateUrl: 'views/edit-lun-path.html',
                controller: 'EditLunPathCtrl',
                breadcrumbOptions: {
                    labelKey: 'workflow-title-edit-lun-paths-edit'
                },
                helpContext: 'T_EDIT_LUN_PATH'
            })
            .when('/login', {
                templateUrl: 'views/login.html',
                controller: 'LoginCtrl'
            })
            .when('/security', {
                templateUrl: 'views/security.html',
                controller: 'SecurityCtrl',
                breadcrumbOptions: {
                    labelKey: 'nav-bar-header-security'
                },
                helpContext: 'T_ADMIN_SECURITY'
            })
            .when('/storage-systems/:storageSystemId', {
                templateUrl: 'views/storage-system.html',
                controller: 'StorageSystemCtrl',
                helpContext: 'R_STORAGE_SYSTEM_DETAILS'
            })
            .when('/storage-systems/:storageSystemId/volumes', {
                templateUrl: 'views/storage-system-volumes.html',
                controller: 'StorageSystemVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-storage-system-volumes',
                    peers: [
                        'storage-ports',
                        'storage-pools',
                        'parity-groups',
                        'external-parity-groups',
                        'replication-groups',
                        'external-volumes',
                        'migration-tasks'
                    ]
                },
                helpContext: 'C_VOLUMES_INV'
            })
            .when('/storage-systems/:storageSystemId/volumes/protect', {
                templateUrl: 'views/protect-volumes.html',
                controller: 'ProtectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'protect-volumes'
                },
                helpContext: 'C_DATAPROTECTION'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/volumes/protect', {
                templateUrl: 'views/protect-volumes.html',
                controller: 'ProtectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'protect-volumes'
                },
                helpContext: 'C_DATAPROTECTION'
            })
            .when('/storage-systems/:storageSystemId/volumes/:volumeId/protect', {
                templateUrl: 'views/protect-volumes.html',
                controller: 'ProtectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'protect-volumes'
                },
                helpContext: 'C_DATAPROTECTION'
            })
            .when('/storage-systems/:storageSystemId/volumes/unprotect', {
                templateUrl: 'views/unprotect-volumes.html',
                controller: 'UnprotectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'unprotect-volume'
                },
                helpContext: 'T_UNPROTECT_VOLUMES'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/volumes/unprotect', {
                templateUrl: 'views/unprotect-volumes.html',
                controller: 'UnprotectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'unprotect-volume'
                },
                helpContext: 'T_UNPROTECT_VOLUMES'
            })
            .when('/storage-systems/:storageSystemId/volumes/:volumeId/unprotect', {
                templateUrl: 'views/unprotect-volumes.html',
                controller: 'UnprotectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'unprotect-volume'
                },
                helpContext: 'T_UNPROTECT_VOLUMES'
            })
            .when('/storage-systems/:storageSystemId/data-protection-monitoring/protect', {
                templateUrl: 'views/protect-volumes.html',
                controller: 'ProtectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'protect-volumes'
                },
                helpContext: 'C_DATAPROTECTION'
            })
            .when('/data-protection-monitoring/protect', {
                templateUrl: 'views/protect-volumes.html',
                controller: 'ProtectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'protect-volumes'
                },
                helpContext: 'C_DATAPROTECTION'
            })
            .when('/hosts/:hostId/protect', {
                templateUrl: 'views/protect-volumes.html',
                controller: 'ProtectVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'protect-volumes'
                },
                helpContext: 'C_DATAPROTECTION'
            })
            .when('/storage-systems/:storageSystemId/volumes/add', {
                templateUrl: 'views/storage-system-volumes-add.html',
                controller: 'StorageSystemVolumesAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-volumes-add'
                },
                helpContext: 'T_HID_CREATING_A_VOLUME'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/volumes/add', {
                templateUrl: 'views/storage-system-volumes-add.html',
                controller: 'StorageSystemVolumesAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-volumes-add'
                },
                helpContext: 'T_HID_CREATING_A_VOLUME'
            })
            .when('/storage-systems/:storageSystemId/volumes/:volumeId', {
                templateUrl: 'views/storage-system-volume.html',
                controller: 'StorageSystemVolumeCtrl',
                helpContext: 'R_VOLUME_DETAILS'
            })
            .when('/storage-systems/:storageSystemId/volumes/:volumeId/update', {
                templateUrl: 'views/storage-system-volume-update.html',
                controller: 'StorageSystemVolumeUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-volume-update'
                },
                helpContext: 'T_UPDATE_VOL'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/volumes', {
                breadcrumbOptions: {
                    labelKey: 'common-storage-system-volumes'
                },
                templateUrl: 'views/storage-pool.html',
                controller: 'StoragePoolCtrl',
                helpContext: 'R_POOL_DETAILS'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/volumes/shred-volumes', {
                templateUrl: 'views/shred-volumes.html',
                controller: 'ShredVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'shred-volumes'
                },
                helpContext: 'T_SHREDDING_VOLUMES'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/volumes/:volumeId', {
                templateUrl: 'views/storage-system-volume.html',
                controller: 'StorageSystemVolumeCtrl',
                helpContext: 'R_VOLUME_DETAILS'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/volumes/:volumeId/update', {
                templateUrl: 'views/storage-system-volume-update.html',
                controller: 'StorageSystemVolumeUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-volume-update'
                },
                helpContext: 'T_UPDATE_VOL'
            })
            .when('/storage-systems/:storageSystemId/attach-volumes', {
                templateUrl: 'views/storage-system-volumes-attach.html',
                controller: 'StorageSystemVolumeAttachCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-volume-attach'
                },
                helpContext: 'T_ATTACH_VOLUME'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/attach-volumes', {
                templateUrl: 'views/storage-system-volumes-attach.html',
                controller: 'StorageSystemVolumeAttachCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-volume-attach'
                },
                helpContext: 'T_ATTACH_VOLUME'
            })
            .when('/storage-systems/:storageSystemId/storage-pools', {
                templateUrl: 'views/storage-pools.html',
                controller: 'StoragePoolsCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-storage-system-pools',
                    peers: [
                        'storage-ports',
                        'volumes',
                        'parity-groups',
                        'external-parity-groups',
                        'replication-groups',
                        'external-volumes',
                        'migration-tasks'
                    ]
                },
                helpContext: 'C_POOLS_INV'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/add', {
                templateUrl: 'views/storage-pools-add.html',
                controller: 'StoragePoolsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-pools-add'
                },
                helpContext: 'C_CREATE_POOL'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/update', {
                templateUrl: 'views/storage-pool-update.html',
                controller: 'StoragePoolUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-pools-update'
                },
                helpContext: 'R_POOL_DETAILS'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId', {
                templateUrl: 'views/storage-pool.html',
                controller: 'StoragePoolCtrl',
                helpContext: 'R_POOL_DETAILS'
            })
            .when('/storage-systems/:storageSystemId/storage-ports', {
                templateUrl: 'views/storage-ports.html',
                controller: 'StoragePortsCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-storage-system-ports',
                    peers: [
                        'volumes',
                        'storage-pools',
                        'parity-groups',
                        'external-parity-groups',
                        'replication-groups',
                        'external-volumes',
                        'migration-tasks'
                    ]
                },
                helpContext: 'T_ENABLE_PORT_SECURITY'
            })
            .when('/storage-systems/:storageSystemId/storage-ports/:storagePortId/edit-iscsi-port', {
                templateUrl: 'views/edit-iscsi-port.html',
                controller: 'EditIscsiPortCtrl',
                breadcrumbOptions: {
                    labelKey: 'edit-iscsi-port'
                },
                helpContext: 'T_EDIT_ISCSI_PORT'
            })
            .when('/storage-systems/:storageSystemId/parity-groups', {
                templateUrl: 'views/parity-groups.html',
                controller: 'ParityGroupsCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-parity-groups',
                    peers: [
                        'storage-ports',
                        'volumes',
                        'storage-pools',
                        'external-parity-groups',
                        'replication-groups',
                        'external-volumes',
                        'migration-tasks'
                    ]
                },
                helpContext: 'C_PARITY_GROUPS_INV'
            })
            .when('/storage-systems/:storageSystemId/external-parity-groups', {
                templateUrl: 'views/external-parity-groups.html',
                controller: 'ExternalParityGroupsCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-external-parity-groups',
                    peers: [
                        'storage-ports',
                        'storage-pools',
                        'volumes',
                        'parity-groups',
                        'replication-groups',
                        'external-volumes',
                        'migration-tasks'
                    ]
                },
                helpContext: 'R_EXTERNAL_PG_INV'
            })
            .when('/storage-systems/:storageSystemId/external-volumes', {
                templateUrl: 'views/external-volumes.html',
                controller: 'ExternalVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-external-volumes',
                    peers: [
                        'storage-ports',
                        'storage-pools',
                        'volumes',
                        'parity-groups',
                        'replication-groups',
                        'external-parity-groups',
                        'migration-tasks'
                    ]
                },
                helpContext: 'R_EXT_VOLS_INV'
            })
            .when('/storage-systems/:storageSystemId/attach-to-storage', {
                templateUrl: 'views/attach-to-storage.html',
                controller: 'AttachToStorageCtrl',
                breadcrumbOptions: {
                    labelKey: 'Attach Volumes to Storage'
                },
                helpContext: 'T_PREVIRTUALIZING_VOLUMES'
            })
            .when('/storage-systems/:storageSystemId/external-volumes/:volumeId', {
                templateUrl: 'views/external-volume.html',
                controller: 'ExternalVolumeCtrl',
                helpContext: 'R_EXT_VOLS_INV'
            })
            .when('/monitoring', {
                templateUrl: 'views/monitoring.html',
                controller: 'MonitoringCtrl',
                breadcrumbOptions: {
                    labelKey: 'nav-bar-header-monitoring'
                },
                helpContext: 'C_MONITORING'
            })
            .when('/storage-systems/:storageSystemId/monitoring', {
                templateUrl: 'views/monitoring.html',
                controller: 'MonitoringCtrl',
                breadcrumbOptions: {
                    labelKey: 'nav-bar-header-monitoring'
                },
                helpContext: 'C_MONITORING'
            })
            .when('/storage-systems/:storageSystemId/parity-groups/disk-manage', {
                templateUrl: 'views/disk-manage.html',
                controller: 'DiskManageCtrl',
                breadcrumbOptions: {
                    labelKey: 'disk-manage'
                },
                helpContext: 'T_MANAGE_FREE_SPARE_DISKS'
            })
            .when('/storage-systems/:storageSystemId/parity-groups/add', {
                templateUrl: 'views/parity-groups-add.html',
                controller: 'ParityGroupsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'parity-groups-add'
                },
                helpContext: 'C_CREATE_PARITY_GROUPS'
            })
            .when('/virtual-storage-machines', {
                templateUrl: 'views/virtual-storage-machines.html',
                controller: 'VirtualStorageMachinesCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-virtual-storage-machines'
                },
                helpContext: 'R_VSM_INVENTORY'
            })
            .when('/virtual-storage-machines/add',{
                templateUrl: 'views/create-vsm.html',
                controller: 'CreateVsmCtrl',
                // TODO: add info for labelKey, helpContext
                breadcrumbOptions: {
                    labelKey: 'common-virtual-storage-machines'
                },
                helpContext: ''
            })
            .when('/virtual-storage-machines/:virtualStorageMachineId/move-existing-volumes', {
                templateUrl: 'views/move-existing-vols-to-vsm.html',
                controller: 'MoveExistingVolsToVsmCtrl',
                breadcrumbOptions: {
                    labelKey: 'move-volumes-to-a-VSM'
                },
                helpContext: 'R_VSM_INVENTORY'
            })
            .when('/virtual-storage-machines/:virtualStorageMachineId/gad-pairs', {
                templateUrl: 'views/virtual-storage-machine-gad-pairs.html',
                controller: 'VirtualStorageMachineGadPairsCtrl',
                breadcrumbOptions: {
                    labelKey: 'gad-pairs'
                },
                helpContext: 'R_VSM_INVENTORY'
            })
            .when('/virtual-storage-machines/:virtualStorageMachineId', {
                templateUrl: 'views/virtual-storage-machine-details.html',
                controller: 'VirtualStorageMachineDetailsCtrl',
                helpContext: 'R_VSM_INVENTORY'
            })
            .when('/virtual-storage-machines', {
                templateUrl: 'views/virtual-storage-machines.html',
                controller: 'VirtualStorageMachinesCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-virtual-storage-machines'
                },
                helpContext: 'R_VSM_INVENTORY'
            })
            .when('/virtual-storage-machines/:virtualStorageMachineId/physical-storage-systems/:physicalStorageSystemId', {
                templateUrl: 'views/physical-storage-system-in-vsm.html',
                controller: 'PhysicalStorageSystemInVsmCtrl',
                helpContext: 'R_VSM_INVENTORY'
            })
            .when('/virtual-storage-machines/:virtualStorageMachineId/add-undefined-resources', {
                templateUrl: 'views/add-undefined-resources-to-vsm.html',
                controller: 'AddUndefinedResourcesToVsmCtrl',
                // TODO: add info for labelKey, helpContext
                breadcrumbOptions: {
                    labelKey: 'common-virtual-storage-machines'
                },
                helpContext: ''
            })
            .when('/virtual-storage-machines/:virtualStorageMachineId/remove-undefined-resources', {
                templateUrl: 'views/remove-undefined-resources-to-vsm.html',
                controller: 'RemoveUndefinedResourcesToVsmCtrl',
                // TODO: add info for labelKey, helpContext
                breadcrumbOptions: {
                    labelKey: 'common-virtual-storage-machines'
                },
                helpContext: ''
            })
            .when('/virtual-storage-machines/:virtualStorageMachineId/physical-storage-systems/:physicalStorageSystemId/summary', {
                templateUrl: 'views/inventory-templates/physical-storage-system-summary-table.html',
                controller: 'PhysicalStorageSystemInVsmCtrl',
                breadcrumbOptions: {
                    labelKey: 'physical-storage-system-summary'
                },
                helpContext: 'R_VSM_INVENTORY'
            })
            .when('/fabric-switches/add', {
                templateUrl: 'views/fabric-switch-add.html',
                controller: 'FabricSwitchAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'fabric-add'
                },
                helpContext: 'T_ADD_FABRIC_SWITCH'
            })
            .when('/fabric-switches', {
                templateUrl: 'views/fabric-switches.html',
                controller: 'FabricSwitchesCtrl',
                breadcrumbOptions: {
                    labelKey: 'fabric-switches'
                },
                helpContext: 'T_ADD_FABRIC_SWITCH'
            })
            .when('/fabric-switches/:sanFabricId/update', {
                templateUrl: 'views/fabric-switch-update.html',
                controller: 'FabricUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'fabric-update'
                },
                helpContext: 'T_ADD_FABRIC_SWITCH'
            })
            .when('/snmp-managers', {
                templateUrl: 'views/snmp-managers.html',
                controller: 'SnmpManagerCtrl',
                breadcrumbOptions: {
                    labelKey: 'snmp-managers'
                },
                helpContext: 'T_ADD_SNMP_MANAGER'
            })
            .when('/snmp-managers/add', {
                templateUrl: 'views/snmp-manager-add.html',
                controller: 'SnmpManagerAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'snmp-manager-add'
                },
                helpContext: 'T_ADD_SNMP_MANAGER'
            })
            .when('/snmp-managers/:name/update', {
                templateUrl: 'views/snmp-manager-update.html',
                controller: 'SnmpManagerUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'snmp-manager-update'
                },
                helpContext: 'T_ADD_SNMP_MANAGER'
            })
            .when('/tier-management', {
                templateUrl: 'views/tier-edit.html',
                controller: 'TierManagementCtrl',
                breadcrumbOptions: {
                    labelKey: 'tier-management'
                },
                helpContext: 'C_TIER_MANAGEMENT'
            })
            .when('/change-local-password', {
                templateUrl: 'views/change-local-password.html',
                controller: 'ChangeLocalPasswordCtrl',
                breadcrumbOptions: {
                    labelKey: 'change-local-password'
                },
                helpContext: 'INDEX'    //TODO: Context
            })
            .when('/storage-systems/:storageSystemId/file-pools', {
                templateUrl: 'views/file-pools.html',
                controller: 'FilePoolsCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-storage-system-file-pools',
                    peers: [
                        'storage-ports',
                        'storage-pools',
                        'volumes',
                        'parity-groups',
                        'external-parity-groups',
                        'external-volumes',
                        'replication-groups',
                        'migration-tasks',
                        'file-systems',
                        'shares-exports',
                        'vfs'
                    ]
                },
                helpContext: 'R_FILE_POOL_INV'
            })
            .when('/storage-systems/:storageSystemId/vfs', {
                templateUrl: 'views/enterprise-virtual-servers.html',
                controller: 'EnterpriseVirtualServersCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-storage-system-file-servers',
                    peers: [
                        'storage-ports',
                        'storage-pools',
                        'volumes',
                        'parity-groups',
                        'external-parity-groups',
                        'external-volumes',
                        'replication-groups',
                        'migration-tasks',
                        'file-pools',
                        'file-systems',
                        'shares-exports'
                    ]
                },
                helpContext: 'R_EVS_INV'
            })
            .when('/storage-systems/:storageSystemId/shares-exports', {
                templateUrl: 'views/shares-exports.html',
                controller: 'SharesExportsCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-storage-system-shares-exports',
                    peers: [
                        'storage-ports',
                        'storage-pools',
                        'volumes',
                        'parity-groups',
                        'external-parity-groups',
                        'external-volumes',
                        'replication-groups',
                        'migration-tasks',
                        'file-pools',
                        'file-systems',
                        'vfs'
                    ]
                },
                helpContext: 'R_SHARE_EXPORT_INV'
            })
            .when('/storage-systems/:storageSystemId/shares-exports/add', {
                templateUrl: 'views/shares-exports-add.html',
                controller: 'SharesExportsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'shares-exports-add'
                },
                helpContext: 'T_CREATE_SHARE_EXPORT'
            })
            .when('/storage-systems/:storageSystemId/file-systems/:fileSystemId/exports/:exportId/update', {
                templateUrl: 'views/exports-update.html',
                controller: 'ExportsUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'export-update'
                },
                helpContext: 'T_UPDATE_EXPORT'
            })
            .when('/storage-systems/:storageSystemId/file-systems/:fileSystemId/shares/:shareId/update', {
                templateUrl: 'views/shares-update.html',
                controller: 'SharesUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'share-update'
                },
                helpContext: 'T_UPDATE_SHARE'
            })
            .when('/storage-systems/:storageSystemId/file-systems/:fileSystemId/shares/:shareId/groups/add', {
                templateUrl: 'views/groups-add.html',
                controller: 'GroupsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'groups-add'
                },
                helpContext: 'T_UPDATE_SHARE'
            })
            .when('/vfs', {
                templateUrl: 'views/enterprise-virtual-servers.html',
                controller: 'EnterpriseVirtualServersCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-storage-system-file-servers'
                },
                helpContext: 'R_EVS_INV'
            })
            .when('/vfs/add', {
                templateUrl: 'views/evs-add.html',
                controller: 'EvsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'evs-add'
                },
                helpContext: 'T_CREATE_EVS'
            })
            .when('/storage-systems/:storageSystemId/file-systems', {
                templateUrl: 'views/file-systems.html',
                controller: 'FileSystemsCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-storage-system-file-systems',
                    peers: [
                        'storage-ports',
                        'storage-pools',
                        'volumes',
                        'parity-groups',
                        'external-parity-groups',
                        'external-volumes',
                        'replication-groups',
                        'migration-tasks',
                        'file-pools',
                        'shares-exports',
                        'vfs'
                    ]
                },
                helpContext: 'R_FILE_SYS_INV'
            })
            .when('/storage-systems/:storageSystemId/file-systems/add',{
                templateUrl: 'views/file-systems-add.html',
                controller: 'FileSystemsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'file-systems-add'
                },
                helpContext: 'T_CREATE_FILE_SYSTEM'
            })
            .when('/storage-systems/:storageSystemId/file-systems/:fileSystemId', {
                templateUrl: 'views/file-system.html',
                controller: 'FileSystemCtrl',
                helpContext: 'R_FILE_SYS_DETAILS'
            })
            .when('/storage-systems/:storageSystemId/vfs/:evsId/file-systems/add',{
                templateUrl: 'views/file-systems-add.html',
                controller: 'FileSystemsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'file-systems-add'
                },
                helpContext: 'T_CREATE_FILE_SYSTEM'
            })
            .when('/storage-systems/:storageSystemId/file-pools/:filePoolId/file-systems/add',{
                templateUrl: 'views/file-systems-add.html',
                controller: 'FileSystemsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'file-systems-add'
                },
                helpContext: 'T_CREATE_FILE_SYSTEM'
            })
            .when('/storage-systems/:storageSystemId/file-systems/:fileSystemId/shares-exports/add', {
                templateUrl: 'views/shares-exports-add.html',
                controller: 'SharesExportsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'shares-exports-add'
                },
                helpContext: 'T_CREATE_SHARE_EXPORT'
            })
            .when('/storage-systems/:storageSystemId/vfs/add', {
                templateUrl: 'views/evs-add.html',
                controller: 'EvsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'evs-add'
                },
                helpContext: 'T_CREATE_EVS'
            })
            .when('/storage-systems/:storageSystemId/vfs/:evsId/update', {
                templateUrl: 'views/evs-update.html',
                controller: 'EvsUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'evs-update'
                },
                helpContext: 'T_UPDATE_EVS'
            })
            .when('/storage-systems/:storageSystemId/vfs/:evsId', {
                templateUrl: 'views/enterprise-virtual-server.html',
                controller: 'EnterpriseVirtualServerCtrl',
                helpContext: 'R_EVS_DETAILS'
            })
            .when('/storage-systems/:storageSystemId/file-systems/:fileSystemId/update',{
                templateUrl: 'views/file-systems-update.html',
                controller: 'FileSystemsUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'file-systems-update'
                },
                helpContext: 'T_UPDATE_FILE_SYSTEM'
            })
            .when('/storage-systems/:storageSystemId/file-pools/:filePoolId/file-systems/:fileSystemId/update',{
                templateUrl: 'views/file-systems-update.html',
                controller: 'FileSystemsUpdateCtrl',
                breadcrumbOptions: {
                    labelKey: 'file-systems-update'
                },
                helpContext: 'T_UPDATE_FILE_SYSTEM'
            })
            .when('/storage-systems/:storageSystemId/file-systems/:fileSystemId/exports/:exportId',{
                templateUrl: 'views/export.html',
                controller: 'ExportCtrl',
                helpContext: 'R_EXPORT_DETAIL'
            })
            .when('/storage-systems/:storageSystemId/file-systems/:fileSystemId/shares/:shareId',{
                templateUrl: 'views/share.html',
                controller: 'ShareCtrl',
                helpContext: 'R_SHARE_DETAIL'
            })
            .when('/storage-systems/:storageSystemId/file-pools/add',{
                templateUrl: 'views/file-pools-add.html',
                controller: 'FilePoolsAddCtrl',
                breadcrumbOptions: {
                    labelKey: 'file-pool-add'
                },
                helpContext: 'T_CREATE_FILE_POOL'
            })
            .when('/storage-systems/:storageSystemId/file-pools/:filePoolId', {
                templateUrl: 'views/file-pool.html',
                controller: 'FilePoolCtrl',
                helpContext: 'R_FILE_POOL_DETAILS'
            })
            .when('/storage-systems/:storageSystemId/file-pools/:filePoolId/expand',{
                templateUrl: 'views/file-pools-expand.html',
                controller: 'FilePoolsExpandCtrl',
                breadcrumbOptions: {
                    labelKey: 'file-pool-expand'
                },
                helpContext: 'T_EXPAND_FILE_POOL'
            })
            .when('/storage-systems/:storageSystemId/storage-pools/:storagePoolId/volumes/:volumeId/detach', {
                templateUrl: 'views/detach-volume.html',
                controller: 'DetachVolumeCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-volume-detach'
                },
                helpContext: ''
            })
            .when('/storage-systems/:storageSystemId/volumes/:volumeId/detach', {
                templateUrl: 'views/detach-volume.html',
                controller: 'DetachVolumeCtrl',
                breadcrumbOptions: {
                    labelKey: 'storage-volume-detach'
                },
                helpContext: ''
            })
            .when('/storage-systems/:storageSystemId/migration-tasks', {
                templateUrl: 'views/migration-tasks.html',
                controller: 'MigrationTasksCtrl',
                breadcrumbOptions: {
                    labelKey: 'common-migration-tasks',
                    peers: [
                        'storage-ports',
                        'volumes',
                        'parity-groups',
                        'storage-pools',
                        'external-parity-groups',
                        'external-volumes',
                        'replication-groups'
                    ]
                },
                helpContext: 'T_INTERRUPTING_MIGRATION_IN_PROGRESS'
            })
            .when('/storage-systems/:storageSystemId/migration-tasks/:migrationTaskId/update', {
                templateUrl: 'views/migrate-volumes.html',
                controller: 'MigrateVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'migrate-volumes-title-update'
                },
                helpContext: 'T_EDIT_MIGRATION_TASK'
            })
            .when('/storage-systems/:storageSystemId/migrate-volumes', {
                templateUrl: 'views/migrate-volumes.html',
                controller: 'MigrateVolumesCtrl',
                breadcrumbOptions: {
                    labelKey: 'migrate-volumes'
                },
                helpContext: 'T_MIGRATING_VOLUMES'
            })
            .otherwise({
                redirectTo: '/'
            });

        $locationProvider.html5Mode(false);

    }).run(function ($location, authService) {
    if (!authService.getUser().authenticated) {
        $location.path('/login');
    }
})
    .constant('rainerColorRange', [
        '#FAA300',
        '#F9D169',
        '#B5B5B5',
        '#CACACA',

        '#FF9B42',
        '#CF6100',
        '#FC2171',
        '#8B001F',
        '#4B6324',
        '#709436',
        '#AAD16D',
        '#339334',
        '#33D134',
        '#99E89A',
        '#033D5A',
        '#367493',
        '#6897AE'])
    .constant('tiersColorRange', [
        '#868686',
        '#fcb663',
        '#E3E4E7',
        '#fbaf17']);
