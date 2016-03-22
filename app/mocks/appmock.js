/**
 * Created by aren on 9/22/15.
 */
'use strict';

window.rainierAppMock = angular.module('rainierAppMock', [
    'rainierApp',
    'ngMockE2E',
    'belMock'
]);

rainierAppMock.run(function($window, $httpBackend, authMock, jobMock, storageSystemMock, dataProtectionMock, storagePoolMock,
                            serversMock, volumeMock, filePoolMock, evsMock, fileSystemMock, sharesMock, exportsMock, tiersMock,
                            filePoolTemplateMock, filePoolExpandTemplateMock, unifiedReportingMock, clusterMock, ethernetInterfaceMock, tierSummaryMock) {
    console.log('!! mocking Rainier backend APIs !!');

    // initialize mocks
    jobMock.init();
    storageSystemMock.init();
    serversMock.init();
    volumeMock.init();
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
    tiersMock.init();

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
            case 'servers':
                return authMock.authenticateAndCall(urlResult, serversMock.handle);
            case 'vfs':
                return authMock.authenticateAndCall(urlResult, evsMock.handle);
            case 'jobs':
                return authMock.authenticateAndCall(urlResult, jobMock.handle);
            case 'templates':
                return templateSwitcher(urlResult);
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
        }
        switch (urlResult.subType) {
            //Just the storage system
            case null:
                return authMock.authenticateAndCall(urlResult, storageSystemMock.handle);
            //Block
            case 'storage-pools':
                return authMock.authenticateAndCall(urlResult, storagePoolMock.handle);
            case 'volumes':
                return authMock.authenticateAndCall(urlResult, volumeMock.handle);
            case 'parity-groups':
                break;
            case 'replication-groups':
                break;
            case 'tiers':
                return authMock.authenticateAndCall(urlResult, tierSummaryMock.handle);
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
                    if(urlResult.subSubType){
                        return authMock.authenticateAndCall(urlResult, filePoolExpandTemplateMock.handle);
                    }
                    return authMock.authenticateAndCall(urlResult, filePoolTemplateMock.handle);
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
