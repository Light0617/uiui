'use strict';

/**
 * @ngdoc service
 * @name rainierApp.orchestratorService
 * @description
 * # orchestratorService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('orchestratorService', function (Restangular, objectTransformService, apiResponseHandlerService, replicationService) {

        var service = {

            storageSystemDisks: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('disks').get());
            },
            storageSystemDisksUpdate: function (storageSystemId, diskId, payload) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).all('disks/' + diskId).post(payload));
            },
            virtualStorageMachines: function() {
              return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('virtual-storage-machines').get().then(function (result) {
                    return result;
                }));
            },
            replicationGroups: function(storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('replication-groups').get().then(function (result) {
                    var externalReplicationGroup = function (type) {
                        return {
                            id: type,
                            storageSystemId: 'N/A',
                            name: 'External',
                            comments: 'N/A',
                            type: type,
                            consistent: 'N/A',
                            numberOfCopies: 'N/A',
                            schedule: 'N/A',
                            scheduleEnabled: 'N/A',
                            primaryVolumeIds: [],
                            failures: 'N/A',
                            status: 'N/A',
                            isExternal: true
                        };
                    };
                    result.replicationGroups.push(externalReplicationGroup(replicationService.rawTypes.CLONE));
                    result.replicationGroups.push(externalReplicationGroup(replicationService.rawTypes.SNAP));
                    _.forEach(result.replicationGroups, function (item) {
                        objectTransformService.transformReplicationGroup(item);
                    });
                    return result;
                }));
            },
            replicationGroupSummary: function(storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('replication-groups/summary').get().then(function (result) {
                    return result;
                }));
            },
            volumePairs: function(storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('volume-pairs').get().then(function (result) {
                    return result;
                }));
            },
            affectedVolumePairsByReplicationGroup: function (storageSystemId, replicationGroupId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('replication-groups', replicationGroupId).one('affected-volume-pairs').get());
            },
            volumePairsByPrimaryVolumeId: function (storageSystemId, primaryVolumeId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('volume-pairs?primaryVolumeId=' + primaryVolumeId).get());
            },
            suspendReplicationGroup: function (storageSystemId, replicationGroupId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('replication-groups/' + replicationGroupId + '/suspend').post());
            },
            resumeReplicationGroup: function (storageSystemId, replicationGroupId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('replication-groups/' + replicationGroupId + '/resume').post());
            },

            deleteReplicationGroup: function (storageSystemId, replicationGroupId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).one('replication-groups', replicationGroupId).remove());
            },

            restoreReplicationGroup: function (storageSystemId, primaryVolumeId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems/' + storageSystemId + '/volumes/' + primaryVolumeId + '/restore').post(payload));
            },
            previrtualizeVolumes: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems/' + storageSystemId + '/volume-manager/previrtualize').post(payload));
            },
            previrtualize: function (payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('volume-manager/pre-virtualize').post(payload));
            },
            jobStatus: function(jobId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('jobs/' + jobId).get().then(function (result) {
                    return result;
                }));
            },
            virtualizeVolumes: function(storageSystemId, payload){
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('volume-manager/' + storageSystemId + '/virtualize').post(payload));
            },
            editReplicationGroup: function (storageSystemId, replicationGroupId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('replication-groups/' + replicationGroupId).patch(payload));
            },
            unprotectReplicationGroup: function (storageSystemId, replicationGroupId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems/' + storageSystemId + '/replication-groups/' + replicationGroupId + '/remove-volumes').post(payload));
            },
            protectVolumes: function (storageSystemId, replicationGroupId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems/' + storageSystemId + '/replication-groups/' + replicationGroupId + '/add-volumes').post(payload));
            },
            createReplicationGroup: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems/' + storageSystemId + '/replication-groups').post(payload));
            },
            productVersionInfo: function () {
                return Restangular.one('product-version').get().then(function (result) {
                    return result;
                });
            },
            dataProtectionSummaryForStorageSystem: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('data-protection/storage-systems', storageSystemId).one('summary').get());
            },

            dataProtectionSummary: function () {
                return Restangular.one('data-protection/summary').get().then(function (result) {
                    return result;
                });
            },
            capacitySavingsSummaryForStorageSystem: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('capacity-savings/storage-systems', storageSystemId).one('summary').get());
            },

            capacitySavingsSummary: function () {
                return Restangular.one('capacity-savings/summary').get().then(function (result) {
                    return result;
                });
            },
            hosts: function () {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('compute/servers').get().then(function (result) {
                    _.forEach(result.servers, function (item) {
                        objectTransformService.transformHost(item);
                    });
                    return result;
                }));
            },
            host: function (hostId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('compute/servers', hostId).get().then(function (result) {
                    objectTransformService.transformHost(result);
                    return result;
                }));
            },
            hostVolumes: function (hostId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('server', hostId).one('volumes').get().then(function (result) {
                    _.forEach(result.dpVolResouce, function (item) {
                        objectTransformService.transformVolume(item);
                    });
                    return result;
                }));
            },
            dpAlertsCountForHost: function (hostId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('data-protection/server', hostId).one('alert').get().then(function (result) {
                    return result;
                }));
            },
            hostsSummary: function () {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('compute/servers/summary').get().then(function (result) {
                    return result;
                }));
            },
            deleteHost: function (hostId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('compute/servers', hostId).remove());
            },
            updateHost: function (hostId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('compute/servers/' + hostId).post(payload));
            },
            // "Obsolete: this API will be discontinued in the next release, please use ~/update-wwpns instead")
            addHostWwn: function (hostId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('compute/servers', hostId).all('add-wwpn').post(payload));
            },
            // "Obsolete: this API will be discontinued in the next release, please use ~/update-wwpns instead")
            removeHostWwn: function (hostId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('compute/servers', hostId).all('remove-wwpn').post(payload));
            },
            updateHostWwn: function (hostId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('compute/servers', hostId).all('update-wwpns').post(payload));
            },
            updateHostIscsi: function (hostId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('compute/servers', hostId).all('update-iscsi-settings').post(payload));
            },
            failedServersForStorageSystem: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('data-protection/storage-systems', storageSystemId).one('servers/failed-servers').get().then(function(result) {
                    return result;
                }));
            },
            storageSystemsSummary: function () {

                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems/summary').get().then(function (result) {
                    objectTransformService.transformStorageSystemsSummary(result);
                    return result;
                }));
            },
            storageSystems: function () {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems').get().then(function (result) {
                    _.forEach(result.storageSystems, function (item) {
                        objectTransformService.transformStorageSystem(item);
                    });
                    return result;
                }));

            },
            storageSystem: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).get().then(function (result) {
                    objectTransformService.transformStorageSystem(result);
                    return result;
                }));
            },
            storageNavigatorSession: function (storageSystemId, sessionScope) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('storage-navigator-session', sessionScope)
                    .get().then(function (result) {
                    return result;
                }));
            },
            deleteStorageSystem: function (storageSystemId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).remove());
            },
            volumes: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('volumes').get().then(function (result) {
                    _.forEach(result.volumes, function (item) {
                        objectTransformService.transformVolume(item);
                    });
                    return result;
                }));
            },
            volume: function (storageSystemId, volumeId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('volumes', volumeId).get().then(function (result) {
                    objectTransformService.transformVolume(result);
                    return result;
                }));
            },
            volumeSummary: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('volumes/summary').get());
            },
            updateVolume: function (storageSystemId, volumeId, updatedVolume) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('volumes/' + volumeId).post(updatedVolume));
            },
            storagePools: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('storage-pools').get().then(function (result) {
                    _.forEach(result.storagePools, function (item) {
                        objectTransformService.transformPool(item);
                    });
                    return result;
                }));
            },
            externalParityGroupSummary: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('external-parity-groups/summary').get());
            },
            storageExternalParityGroups: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('external-parity-groups').get().then(function (result) {
                    if(result.externalParityGroups){
                      _.forEach(result.externalParityGroups, function (item) {
                      objectTransformService.transformExternalParityGroup(item);
                      });
                    }
                    return result;
                }));
            },
            storagePool: function (storageSystemId, storagePoolId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('storage-pools', storagePoolId).get().then(function (result) {
                    objectTransformService.transformPool(result);
                    return result;
                }));
            },
            storagePoolsSummary: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('storage-pools/summary').get());
            },
            updateStoragePool: function (storageSystemId, storagePoolId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('storage-pools/' + storagePoolId).post(payload));
            },
            deleteStoragePool: function (storageSystemId, storagePoolId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).one('storage-pools', storagePoolId).remove());
            },
            createStoragePool: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('storage-pools').post(payload));
            },
            storagePorts: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('storage-ports').get()).then(function (result) {
                    apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).get().then(function (storageSystemResult) {
                        objectTransformService.transformStorageSystem(storageSystemResult);
                        var storageSystemModel = storageSystemResult.model;
                        _.forEach(result.storagePorts, function (item) {
                            item.storageSystemModel = storageSystemModel;
                            objectTransformService.transformPort(item);
                        });
                    }));
                    return result;
                });
            },
            storagePort: function (storageSystemId, storagePortId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('storage-ports', storagePortId).get());
            },
            updateStoragePort: function (storageSystemId, storagePortId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('storage-ports/' + storagePortId).post(payload));
            },
            parityGroups: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('parity-groups').get().then(function (result) {
                    _.forEach(result.parityGroups, function (item) {
                        objectTransformService.transformParityGroup(item);
                    });
                    return result;
                }));

            },
            parityGroupSummary: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('parity-groups/summary').get());

            },
            parityGroup: function (storageSystemId, parityGroupId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('parity-groups', parityGroupId).get().then(function (result) {
                    objectTransformService.transformParityGroup(result);
                    return result;
                }));

            },
            initializeParityGroup: function (storageSystemId, parityGroupId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('parity-groups/' + parityGroupId + '/initialize').post());
            },
            compressParityGroup: function (storageSystemId, parityGroupId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('parity-groups/' + parityGroupId + '/compress').post());
            },
            deleteParityGroup: function (storageSystemId, parityGroupId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).one('parity-groups', parityGroupId).remove());
            },
            poolTemplate: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('templates').one('pool').get());
            },
            getUpdatePoolTemplate: function (storageSystemId, storagePoolId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('templates').one('pool', storagePoolId).get());
            },
            tiers: function () {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('templates').one('tiers').get());
            },
            tierSummary: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('tiers/summary').get());
            },
            updateTier: function (tierId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('templates/tiers/' + tierId).post(payload));
            },
            createServers: function (payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('compute/servers').post(payload));
            },
            parityGroupTemplate: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('templates').one('parity-group').get());
            },
            createParityGroup: function (storageSystemId, createParityGroupPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('parity-groups').post(createParityGroupPayload));
            },
            createParityGroups: function (storageSystemId, createParityGroupsPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('templates/parity-group').post(createParityGroupsPayload));
            },
            storageSystemHostModeOptions: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('host-mode-options').get().then(function (result) {
                    return objectTransformService.transformToHostModeOptions(result);
                }));
            },
            createVolumes: function (createVolumesPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('volume-manager/create').post(createVolumesPayload));
            },
            attachVolume: function (attachVolumePayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('volume-manager/attach').post(attachVolumePayload));
            },
            detachVolume: function (detachVolumePayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('volume-manager/detach').post(detachVolumePayload));
            },
            createAttachProtectVolumes: function (payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('volume-manager/create-attach-protect').post(payload));
            },
            autoPathSelect: function (autoPathSelectionPayload) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.all('volume-manager/auto-path-select').post(autoPathSelectionPayload));
            },
            editLunPaths: function (editLunPathPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('volume-manager/edit-lun-paths').post(editLunPathPayload));
            },
            deleteVolume: function (storageSystemId, volumeId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).one('volumes', volumeId).remove());
            },
            deployPoolTemplate: function (storageSystemId, deployPoolTemplatePayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('templates/pool').post(deployPoolTemplatePayload));
            },
            updatePoolTemplate: function (storageSystemId, storagePoolId, deployPoolTemplatePayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('templates/pool/' + storagePoolId).post(deployPoolTemplatePayload));
            },
            addStorageSystem: function (registerStorageSystemPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems').post(registerStorageSystemPayload));
            },
            updateStorageSystem: function (storageSystemId, updateStorageSystemPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems/' + storageSystemId).post(updateStorageSystemPayload));
            },
            migrationTasks: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('migration-tasks').get());
            },
            migrationTask: function (storageSystemId, migrationTaskId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('migration-tasks', migrationTaskId).get());
            },
            createMigrationTask: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('migration-tasks').post(payload));
            },
            deleteMigrationTask: function (storageSystemId, migrationTaskId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).one('migration-tasks', migrationTaskId).remove());
            },
            updateMigrationTask: function (storageSystemId, migrationTaskId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('migration-tasks/' + migrationTaskId).post(payload));
            },
            interruptMigrationTask: function (storageSystemId, migrationTaskId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('storage-systems', storageSystemId).all('migration-tasks/', migrationTaskId, '/interrupt').post());
            },
            jobsTimeSlice: function (fromDate, toDate) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('jobs').get({
                    fromStartDate: fromDate.replace('Z', '+0000'),
                    toStartDate: toDate.replace('Z', '+0000')
                }));
            },
            accountDomains: function () {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('security/account-domains').get());
            },
            addAccountDomain: function (accountDomainPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('security/account-domains').post(accountDomainPayload));
            },
            updateAccountDomain: function (accountDomainId, accountDomainPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('security/account-domains/' + accountDomainId).post(accountDomainPayload));
            },
            deleteAccountDomain: function (accountDomainId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('security/account-domains', accountDomainId).remove());
            },
            userGroups: function (accountDomainId, filterKey) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('security/account-domains', accountDomainId).one('groups?filter=' + filterKey).get());
            },
            groupMappings: function (accountDomainId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('security/account-domains', accountDomainId).one('group-mappings').get());
            },
            addGroupMapping: function (accountDomainId, groupMappingPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('security/account-domains', accountDomainId).all('group-mappings').post(groupMappingPayload));
            },
            deleteGroupMapping: function (accountDomainId, groupMappingId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('security/account-domains', accountDomainId).one('group-mappings', groupMappingId).remove());
            },
            getSystemAccountsDomain: function (accountDomainId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('security/account-domains/', accountDomainId).one('users').get());
            },
            updateSystemAccountDomain: function (accountDomainId, userId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('security/account-domains/' + accountDomainId + '/users/' + userId).post(payload));
            },
            addFabrics: function (fabricSwitchPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('san-fabrics').post(fabricSwitchPayload));
            },
            fabrics: function () {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('san-fabrics').get()).then(function (result) {
                    _.forEach(result.resources, function (item) {
                        objectTransformService.transformFabricSwitch(item);
                    });
                    return result;
                });
            },
            fabric: function (sanFabricId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('san-fabrics', sanFabricId).get());
            },
            deleteFabric: function (sanFabricId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('san-fabrics', sanFabricId).remove());
            },
            updateFabric: function (sanFabricId, updatedFabric) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('san-fabrics/' + sanFabricId).post(updatedFabric));
            },
            snmpManagers: function () {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('snmp-managers').get());
            },
            snmpManager: function (snmpMgrName) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('snmp-managers', snmpMgrName).get());
            },
            deleteSnmpManager: function (snmpMgrName) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('snmp-managers', snmpMgrName).remove());
            },
            updateSnmpManager: function (snmpMgrName, snmpManagerPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('snmp-managers/' + snmpMgrName).post(snmpManagerPayload));
            },
            addSnmpManager: function (snmpManagerPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('snmp-managers').post(snmpManagerPayload));
            },
            commonSettings: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('settings/common').withHttpConfig({timeout: 15 * 60 * 1000}).get());
            },
            updateCommonSettings: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems/' + storageSystemId + '/settings/common').post(payload));
            },
            timeZones: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('settings/time-zones').withHttpConfig({timeout: 15 * 60 * 1000}).get());
            },
            dateTime: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('settings/date-time').withHttpConfig({timeout: 15 * 60 * 1000}).get());
            },
            updateDateTime: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems/' + storageSystemId + '/settings/date-time').post(payload));
            },
            alertNotifications: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('settings/alert-notifications').withHttpConfig({timeout: 15 * 60 * 1000}).get());
            },
            updateAlertNotifications: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems/' + storageSystemId + '/settings/alert-notifications').post(payload));
            },
            licenses: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId).one('settings/licenses').withHttpConfig({timeout: 15 * 60 * 1000}).get());
            },
            updateLicenses: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.all('storage-systems/' + storageSystemId + '/settings/licenses').post(payload));
            },
            status: function (category) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('monitoring/status/' + category).get());
            },
            statusByStorageSystem: function (category, storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('monitoring/status', storageSystemId).one(category).get());
            },
            hardwareAlerts: function (componentType) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('monitoring/status/hardware', componentType).get());
            },
            capacityAlerts: function (componentType) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('monitoring/status/capacity', componentType).get());
            },
            hardwareAlertsByStorageSystem: function (componentType, storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('monitoring/status', storageSystemId).one('hardware', componentType).get());
            },
            capacityAlertsByStorageSystem: function (componentType, storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('monitoring/status', storageSystemId).one('capacity', componentType).get());
            },
            filePools: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-pools').get().then(function (result) {
                    _.forEach(result.filePools, function (item) {
                        objectTransformService.transformFilePools(item, storageSystemId);
                    });
                    return result;
                }));
            },
            filePool: function (storageSystemId, filePoolId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-pools', filePoolId).get().then(function (result) {
                    objectTransformService.transformFilePools(result, storageSystemId);
                    return result;
                }));
            },
            cluster: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('cluster').get().then(function (result) {
                    objectTransformService.transformCluster(result);
                    return result;
                }));
            },
            enterpriseVirtualServers: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('vfs').get().then(function (result) {
                    result.evses = _.reject(result.evses, function(evs) { return evs.type === 'admin'; });
                    _.forEach(result.evses, function (evs) {
                        objectTransformService.transformEVS(evs);
                    });
                    return result;
                }));
            },
            enterpriseVirtualServer: function (storageSystemId, evsId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('vfs', evsId).get().then(function (result) {
                        objectTransformService.transformEVS(result);
                    return result;
                }));
            },
            allEnterpriseVirtualServers: function () {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/vfs').get().then(function (result) {
                    result.evses = _.reject(result.evses, function(evs) { return evs.type === 'admin'; });
                    _.forEach(result.evses, function (evs) {
                        objectTransformService.transformEVS(evs);
                    });
                    return result;
                }));
            },
            evsFileSystems: function(storageSystemId, evsId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('vfs', evsId).one('file-systems').get().then(function (result) {
                    _.forEach(result.fileSystems, function (fileSystem) {
                        objectTransformService.transformFileSystems(fileSystem, storageSystemId);
                    });
                    return result;
                }));
            },
            fileSystems: function(storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems').get().then(function (result) {
                    _.forEach(result.fileSystems, function (fileSystem) {
                        objectTransformService.transformFileSystems(fileSystem, storageSystemId);
                    });
                    return result;
                }));
            },
            filePoolFileSystems: function(storageSystemId, filePoolId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-pools', filePoolId).one('file-systems').get().then(function (result) {
                    _.forEach(result.fileSystems, function (fileSystem) {
                        objectTransformService.transformFileSystems(fileSystem, storageSystemId);
                    });
                    return result;
                }));
            },
            deleteFileSystem: function (storageSystemId, fileSystemsId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemsId).remove());
            },
            createFileSystem: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).all('file-systems').post(payload));
            },
            allShares: function(storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('shares').get().then(function (result) {
                    _.forEach(result.shares, function (share) {
                        objectTransformService.transformShare(share);
                    });
                    return result;
                }));
            },
            allExports: function(storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('exports').get().then(function (result) {
                    _.forEach(result.exports, function (exports) {
                        objectTransformService.transformExport(exports);
                    });
                    return result;
                }));
            },
            shares: function(storageSystemId, fileSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemId).one('shares').get().then(function (result) {
                    _.forEach(result.shares, function (share) {
                        objectTransformService.transformShare(share);
                    });
                    return result;
                }));
            },
            share: function(storageSystemId, fileSystemId, shareId, updateShare) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemId).one('shares', shareId).get().then(function (result) {
                    objectTransformService.transformShare(result, updateShare);
                    return result;
                }));
            },
            addShare: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).all('shares').post(payload));
            },
            export: function(storageSystemId, fileSystemId, exportId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemId).one('exports', exportId).get().then(function (result) {
                    objectTransformService.transformExport(result);
                    return result;
                }));
            },
            exports: function(storageSystemId, fileSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemId).one('exports').get().then(function (result) {
                    _.forEach(result.exports, function (exports) {
                        objectTransformService.transformExport(exports);
                    });
                    return result;
                }));
            },
            addExport: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).all('exports').post(payload));
            },
            deleteShare: function (storageSystemId, fileSystemsId, shareId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemsId).one('shares', shareId).remove());
            },
            patchShare: function (storageSystemId, fileSystemsId, shareId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemsId).one('shares', shareId).patch(payload));
            },
            deleteExport: function (storageSystemId, fileSystemsId, exportId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemsId).one('exports', exportId).remove());
            },
            patchExport: function (storageSystemId, fileSystemsId, exportId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemsId).one('exports', exportId).patch(payload));
            },
            fileSystem: function (storageSystemId, fileSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemId).get().then(function (result) {
                    objectTransformService.transformFileSystems(result, storageSystemId);
                    return result;
                }));
            },
            patchFileSystem: function (storageSystemId, fileSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-systems', fileSystemId).patch(payload));
            },
            addEvs: function (registerEvsPayload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', registerEvsPayload.storageSystemId).all('vfs').post(registerEvsPayload));
            },
            deleteEvs: function (storageSystemId, evsId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('vfs', evsId).remove());
            },
            patchEvs: function (storageSystemId, evsId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('vfs', evsId).patch(payload));
            },
            filePoolTemplate: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('templates/file-pool').get());
            },
            filePoolExpandTemplate: function (storageSystemId, filePoolId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('templates/file-pool', filePoolId).one('expand').get());
            },
            createFilePool: function (storageSystemId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).all('templates/file-pool').post(payload));
            },
            expandFilePool: function (storageSystemId, filePoolId, payload) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).all('templates/file-pool/' + filePoolId).patch(payload));
            },
            deleteFilePool: function (storageSystemId, filePoolId) {
                return apiResponseHandlerService._apiResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-pools', filePoolId).remove());
            },
            filePoolSummary: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('file-pool-summary').get().then(function (result) {
                    return result;
                }));
            },
            filePoolsSummary: function () {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems').one('file-pool-summary').get().then(function (result) {
                    return result;
                }));
            },
            ethernetInterfaces: function (storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('file/storage-systems', storageSystemId).one('ethernet-interfaces').get().then(function (result) {
                    return result;
                }));
            }
        };

        return service;
    });
