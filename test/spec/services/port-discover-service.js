/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

describe('Service: portDiscoverService tests', function () {
    var portDiscoverService, $q, $httpBackend, $rootScope;

    var orchestratorServiceMock = {
        discoverLun: function (portId, storageSystemId) {
            return $q.resolve([
                {
                    portId: portId + 'src',
                    capacity: 1000,
                    lunId: 0,
                    iscsiInfo: {
                        ip: '172.17.71.2',
                        iscsiName: 'iscsi'
                    }
                },
                {
                    portId: portId + 'src',
                    capacity: 1000,
                    lunId: 0,
                    iscsiInfo: {
                        ip: '172.17.71.2',
                        iscsiName: 'iscsi'
                    }
                },
                {
                    portId: portId + 'src',
                    capacity: 1000,
                    wwn: 'wwn',
                    lunId: 0,
                },
                {
                    portId: portId + 'src',
                    capacity: 1000,
                    wwn: 'wwn',
                    lunId: 0,
                }
            ]);
        }
    };

    beforeEach(function () {
        module('rainierApp');
        module(function ($provide) {
            $provide.value('orchestratorService', orchestratorServiceMock);
        });
    });

    beforeEach(inject(function (_portDiscoverService_, _$q_, _$rootScope_, _$httpBackend_) {
        portDiscoverService = _portDiscoverService_;
        $q = _$q_;
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        $httpBackend.whenGET('/i18n/translation.json').respond({
            success: {}
        });
    }));

    describe('discoverLuns', function () {
        it('should resolve with array', function () {
            var data;
            var deferred = $q.defer();
            var promise = deferred.promise;

            promise.then(function (response) {
                data = response;
            });

            portDiscoverService
                .discoverLuns(['CL1-A', 'CL21-C'], 1)
                .then(function (response) {
                    deferred.resolve(response);
                });

            $rootScope.$digest();

            expect(data.length).toEqual(8);

        });
    });
});
