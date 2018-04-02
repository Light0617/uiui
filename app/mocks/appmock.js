/**
 * Created by aren on 9/22/15.
 */
'use strict';

window.rainierAppMock = angular.module('rainierAppMock', [
    'rainierApp',
    'ngMockE2E',
    'belMock'
]);

rainierAppMock.run(function(
    $window, $httpBackend, authMock, jobMock, storageSystemMock, dataProtectionMock, storagePoolMock,
    serversMock, volumeMock, filePoolMock, evsMock, fileSystemMock, sharesMock, exportsMock, tiersMock,
    filePoolTemplateMock, filePoolExpandTemplateMock, unifiedReportingMock, clusterMock, ethernetInterfaceMock, tierSummaryMock, savingsSummaryMock,
    parityGroupMock, storagePortsMock, externalParityGroupMock, storagePoolTemplateMock, diskMock, parityGroupTemplateMock,
    replicationgroupmock, volumepairmock, virtualStorageMachineMock, fabricmock, licensemock, monitorCapacityMock, monitorHardwareMock,
    monitorHardwareMockById, monitorCapacityMockById, resourceTrackerMock, hostModeOptionsMock, hostGroupsMock, volumeManagerMock,
    migrationTaskMock, rainierJobsMock, discoverLunMock

) {


    console.log('!! mocking Rainier backend APIs !!');

    // initialize mocks
    jobMock.init();
    storageSystemMock.init();
    serversMock.init();
    volumeMock.init();
    virtualStorageMachineMock.init();
    filePoolMock.init();
    evsMock.init();
    fileSystemMock.init();
    sharesMock.init();
    exportsMock.init();
    storagePoolMock.init();
    filePoolTemplateMock.init();
    filePoolExpandTemplateMock.init();
    unifiedReportingMock.init();
    clusterMock.init();
    dataProtectionMock.init();
    ethernetInterfaceMock.init();
    tierSummaryMock.init();
    savingsSummaryMock.init();
    tiersMock.init();
    parityGroupMock.init();
    externalParityGroupMock.init();
    storagePoolTemplateMock.init();
    replicationgroupmock.init();
    volumepairmock.init();
    virtualStorageMachineMock.init();
    fabricmock.init();
    serversMock.init();
    migrationTaskMock.init();
    discoverLunMock.init();


    var parseUrl = function(method, url, data, headers) {
        var type = '',
            subType = null,
            subResourceId = null,
            subSubType = null,
            subSubResourceId = null,
            resourceId = '',
            action = '',
            actionId = '',
            trimmedUrl,
            queryParams = [];

        trimmedUrl = getTrimmedUrl(url);

        if (trimmedUrl.length > 0) {
            // handle query params
            var query = trimmedUrl.split('?');
            if (query.length > 1) {
                queryParams = query[1].split('&');
            }

            var splits = _.without(query[0].split('/'), 'file');

            if (splits.length > 1){
                //case: /storage-systems
                type = splits[1];
            }

            if (splits.length > 2) {
                //case: /storage-systems/{storage-system-id}
                action = splits[2];
                resourceId = splits[2];
            }

            if (splits.length > 3) {
                //case: /storage-systems/{storage-system-id}/storage-pools
                action = splits[3];
                subType = splits[3];
            }

            if (splits.length > 4) {
                //case: /storage-systems/{storage-system-id}/storage-pools/{storage-pool-id}
                action = splits[4];
                subResourceId = splits[4];
            }

            if (splits.length > 5){
                //case: /storage-systems/{storage-system-id}/file-pools/{file-pool-id}/file-systems
                subSubType = splits[5];
            }

            if (splits.length > 6){
                //case: /storage-systems/{storage-system-id}/file-pools/{file-pool-id}/file-systems/export/{export-id}
                subSubResourceId = splits[6];
            }
        }

        return {
            method: method,
            url: url,
            data: data,
            headers: headers,
            type: type,
            resourceId: resourceId,
            action: action,
            actionId: actionId,
            queryParams: queryParams,
            subType: subType,
            subSubType: subSubType,
            subResourceId: subResourceId,
            subSubResourceId: subSubResourceId
        };
    };

    var getTrimmedUrl = function(url) {
        var newUrl = '';
        if (url.indexOf('/v1') !== -1) {
            newUrl = url.replace('/v1', '');
        }
        return newUrl;
    };

    var handleRequest = function(method, url, data, headers) {
        console.log('Calling ' + method + ' on ' + url + ' with body ' + data);

        var urlResult = parseUrl(method, url, data, headers);
        switch (urlResult.type) {
            case 'storage-systems':
                return storageSystemSwitcher(urlResult);
            case 'security':
                return authMock.handle(urlResult);
            case 'data-protection':
                return authMock.authenticateAndCall(urlResult, dataProtectionMock.handle);
            case 'capacity-savings':
                return authMock.authenticateAndCall(urlResult, savingsSummaryMock.handle);
            case 'compute':
            case 'server':
                return authMock.authenticateAndCall(urlResult, serversMock.handle);
            case 'vfs':
                return authMock.authenticateAndCall(urlResult, evsMock.handle);
            case 'jobs':
                if(rainierJobsMock.target(urlResult)) {
                    return authMock.authenticateAndCall(urlResult, rainierJobsMock.handle);
                } else {
                    return authMock.authenticateAndCall(urlResult, jobMock.handle);
                }
                break;
            case 'templates':
                return templateSwitcher(urlResult);
            case 'san-fabrics':
                return authMock.authenticateAndCall(urlResult, fabricmock.handle);
            case 'monitoring':
                return monitorGroupSwitcher(urlResult);
            case 'virtual-storage-machines':
                return authMock.authenticateAndCall(urlResult, virtualStorageMachineMock.handle);
            case 'resource-tracker':
                return resourceTrackerReservedResources(urlResult);
            case 'volume-manager':
                return authMock.authenticateAndCall(urlResult, volumeManagerMock.handle);
        }
    };

    var resourceTrackerReservedResources = function(urlResult)  {
        if(urlResult.resourceId)  {
            return authMock.authenticateAndCall(urlResult, resourceTrackerMock.handle);
        }
    };

    var monitorGroupSwitcher = function(urlResult)  {
        switch (urlResult.subType)  {
            case 'hardware':
                return authMock.authenticateAndCall(urlResult, monitorHardwareMock.handle);
            case 'capacity':
                return authMock.authenticateAndCall(urlResult, monitorCapacityMock.handle);
            default:
                return monitorSwitcher(urlResult);

        }
    };

    var monitorSwitcher = function(urlResult)  {
        switch(urlResult.subResourceId)  {
            case 'hardware':
                return authMock.authenticateAndCall(urlResult, monitorHardwareMockById.handle);
            case 'capacity':
                return authMock.authenticateAndCall(urlResult, monitorCapacityMockById.handle);
            default:
                console.log(urlResult + 'not implemented yet');
                return null;
        }
    };

    var templateSwitcher = function(urlResult) {
        switch(urlResult.resourceId) {
            case 'tiers':
                return authMock.authenticateAndCall(urlResult, tiersMock.handle);
        }
    };

    var storageSystemSwitcher = function(urlResult) {
        switch (urlResult.resourceId) {
            case 'new':
                return authMock.authenticateAndCall(urlResult, storageSystemMock.handle, true);
            case 'file-pool-summary':
                return authMock.authenticateAndCall(urlResult, unifiedReportingMock.handle);
        }
        switch (urlResult.subSubType) {
            case null:
                break;
            case 'file-systems':
                break;
            case 'vfs':
                break;
            case 'shares':
                break;
            case 'discover-groups':
                return authMock.authenticateAndCall(urlResult, discoverLunMock.handle);
        }
        switch (urlResult.subType) {
            //Just the storage system
            case null:
                return authMock.authenticateAndCall(urlResult, storageSystemMock.handle);
            //Block
            case 'settings':
                if (urlResult.subResourceId === 'licenses') {
                    return authMock.authenticateAndCall(urlResult, licensemock.handle);
                }
                break;
            case 'storage-pools':
                return authMock.authenticateAndCall(urlResult, storagePoolMock.handle);
            case 'storage-ports':
                return authMock.authenticateAndCall(urlResult, storagePortsMock.handle);
            case 'volumes':
                return authMock.authenticateAndCall(urlResult, volumeMock.handle);
            case 'parity-groups':
                return authMock.authenticateAndCall(urlResult, parityGroupMock.handle);
            case 'external-parity-groups':
                return authMock.authenticateAndCall(urlResult, externalParityGroupMock.handle);
            case 'replication-groups':
                return authMock.authenticateAndCall(urlResult, replicationgroupmock.handle);
            case 'disks':
                return authMock.authenticateAndCall(urlResult, diskMock.handle);
            case 'volume-pairs':
                return authMock.authenticateAndCall(urlResult, volumepairmock.handle);
            case 'tiers':
                return authMock.authenticateAndCall(urlResult, tierSummaryMock.handle);
            case 'capacity-savings':
                return authMock.authenticateAndCall(urlResult, savingsSummaryMock.handle);
            //File
            case 'file-pool-summary':
                return authMock.authenticateAndCall(urlResult, unifiedReportingMock.handle);
            case 'file-pools':
                if(urlResult.subResourceId === 'templates'){
                    return authMock.authenticateAndCall(urlResult, filePoolTemplateMock.handle);
                }
                else if(urlResult.subSubType === 'expand'){
                    return authMock.authenticateAndCall(urlResult, filePoolExpandTemplateMock.handle);
                }
                else if(urlResult.subSubType === 'file-systems'){
                    return authMock.authenticateAndCall(urlResult, fileSystemMock.handle);
                }
                return authMock.authenticateAndCall(urlResult, filePoolMock.handle);
            case 'templates':
                if(urlResult.subResourceId === 'file-pool'){
                    return authMock.authenticateAndCall(urlResult, filePoolTemplateMock.handle);
                }
                else if(urlResult.subResourceId === 'parity-group') {
                    return authMock.authenticateAndCall(urlResult, parityGroupTemplateMock.handle);
                }
                else if(urlResult.subResourceId === 'pool'){
                    if(urlResult.subSubType){
                        return authMock.authenticateAndCall(urlResult, storagePoolTemplateMock.handle);
                    }
                    return authMock.authenticateAndCall(urlResult, storagePoolTemplateMock.handle);
                }
                break;
            case 'file-systems':
                if(urlResult.subSubType === 'export' || urlResult.subSubType === 'exports') {
                    return authMock.authenticateAndCall(urlResult, exportsMock.handle);
                }
                else if(urlResult.subSubType === 'share' || urlResult.subSubType === 'shares') {
                    return authMock.authenticateAndCall(urlResult, sharesMock.handle);
                }
                return authMock.authenticateAndCall(urlResult, fileSystemMock.handle);
            case 'vfs':
                if(urlResult.subSubType === 'file-systems'){
                    return authMock.authenticateAndCall(urlResult, fileSystemMock.handle);
                }
                return authMock.authenticateAndCall(urlResult, evsMock.handle);
            case 'shares':
                return authMock.authenticateAndCall(urlResult, sharesMock.handle);
            case 'exports':
                return authMock.authenticateAndCall(urlResult, exportsMock.handle);
            case 'cluster':
                return authMock.authenticateAndCall(urlResult, clusterMock.handle);
            case 'data-protection':
                return authMock.authenticateAndCall(urlResult, dataProtectionMock.handle);
            case 'ethernet-interfaces':
                return authMock.authenticateAndCall(urlResult, ethernetInterfaceMock.handle);
            case 'host-mode-options':
                return authMock.authenticateAndCall(urlResult, hostModeOptionsMock.handle);
            case 'host-groups':
                return authMock.authenticateAndCall(urlResult, hostGroupsMock.handle);
            case 'migration-tasks':
                return authMock.authenticateAndCall(urlResult, migrationTaskMock.handle);
            case 'migration-pairs':
                return authMock.authenticateAndCall(urlResult, migrationTaskMock.handlePairs);

        }
    };

    $httpBackend.whenGET(/v1/).respond(handleRequest);
    $httpBackend.whenPOST(/v1/).respond(handleRequest);
    $httpBackend.whenDELETE(/v1/).respond(handleRequest);

    $window.rainierAppMock = {};
    $window.rainierAppMock.storagesystems = storageSystemMock.getMock();
    $window.rainierAppMock.jobs = jobMock.getMock();


    $httpBackend.whenGET().passThrough();

});
