/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

describe('Service: previrtualizeService tests', function () {
    var previrtualizeService, $q, $rootScope, $httpBackend, status, finishedJobResponse;

    var pollingCount = 0;
    var orchestratorServiceMock = {
        previrtualize: function () {
            return $q.resolve({jobId: 0});
        },
        jobStatus: function (jobId) {
            var working = {jobId: jobId, status: status.inprogress};
            var result = pollingCount <= 0 ? finishedJobResponse : working;
            return $q.resolve(result);
        },
        virtualizedVolumes: function () {
            return $q.resolve([
                {id: 1},
                {id: 2},
                {id: 3}
            ]);
        }
    };

    beforeEach(function () {
        module('rainierApp');
        module(function ($provide) {
            $provide.value('orchestratorService', orchestratorServiceMock);
        });
    });

    beforeEach(inject(function (_previrtualizeService_, _$q_, _$rootScope_, _$httpBackend_, _constantService_) {
        previrtualizeService = _previrtualizeService_;
        $q = _$q_;
        $rootScope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        $httpBackend.whenGET('/i18n/translation.json').respond({
            success: {}
        });
        status = _constantService_.previrtualizeJobStatus;
        finishedJobResponse = {jobId: 0, status: status.success};
    }));

    describe('previrtualize', function () {
        it('returns a promise', function () {
            expect(previrtualizeService.previrtualize(1, {}).then).toBeDefined();
        });

        it('should resolve with jobid', function () {
            var data;
            var deferred = $q.defer();
            var promise = deferred.promise;

            promise.then(function (response) {
                data = response;
            });

            previrtualizeService.previrtualize(1, {}).then(function (response) {
                deferred.resolve(response);
            });

            $rootScope.$digest();

            expect(data).toEqual(0);
        });
    });

    describe('handleJob', function () {
        it('returns a function which should resolve with jobId when the job succeed.', function () {
            var data;
            var defferForKarma = $q.defer();
            var defer = $q.defer();
            var promise = defferForKarma.promise;

            promise.then(function (response) {
                data = response;
            });

            previrtualizeService.handleJob(0, defer)({status: status.success, jobId: 0});
            defer.promise.then(function (response) {
                defferForKarma.resolve(response);
            });

            $rootScope.$digest();

            expect(data.jobId).toEqual(0);
        });

        it('returns a function which should resolve with false when the job failed.', function () {
            var data;
            var deferForKarma = $q.defer();
            var defer = $q.defer();
            var promise = deferForKarma.promise;

            promise.then(function (response) {
                data = response;
            });

            previrtualizeService.handleJob(0, defer)({status: status.failed, jobId: 0});
            defer.promise.catch(function (response) {
                deferForKarma.resolve(response);
            });

            $rootScope.$digest();

            expect(data).toEqual('job-failed-error');
        });

        it('returns a function which should resolve with status finished' +
            'when the job is in progress and retry process executed.', inject(function ($timeout) {
            var data;
            var deferForKarma = $q.defer();
            var defer = $q.defer();
            var promise = deferForKarma.promise;

            promise.then(function (response) {
                data = response;
            });

            previrtualizeService.handleJob(0, defer)({status: status.inprogress, jobId: 0});
            defer.promise.then(function (response) {
                deferForKarma.resolve(response);
            });

            $timeout.flush();
            $rootScope.$digest();

            expect(data.status).toEqual(status.success);
        }));

    });
});
