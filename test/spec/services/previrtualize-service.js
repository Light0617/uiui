/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

describe('Service: previrtualizeService tests', function () {
    var previrtualizeService, $q, $rootScope, $httpBackend;
    beforeEach(module('rainierApp'));
    beforeEach(inject(function (_previrtualizeService_, _$q_, _$rootScope_, _$httpBackend_) {
        previrtualizeService = _previrtualizeService_;
        $q = _$q_;
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        $httpBackend.whenGET('/i18n/translation.json').respond({
            success: {}
        });
    }));

    describe('previrtualize', function () {
        it('returns a promise', function () {
            expect(previrtualizeService.previrtualize(1,{}).then).toBeDefined();
        });

        it('should resolve with something', function () {
            var data;
            var deferred = $q.defer();
            var promise = deferred.promise;

            promise.then(function (response) {
                data = response;
            });

            previrtualizeService.previrtualize(1, {}).then(function(response) {
                deferred.resolve(response);
            });

            $rootScope.$digest();

            expect(data).toEqual('something');
        });
    });
});
