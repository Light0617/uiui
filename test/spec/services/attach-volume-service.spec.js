/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

describe('Service: attachVolumeService tests', function () {
    var attachVolumeService;

    beforeEach(function () {
        module('rainierApp');
    });

    beforeEach(inject(function (_attachVolumeService_) {
        attachVolumeService = _attachVolumeService_;
    }));

    describe('isMultipleVsm', function () {
        it('returns true if the argument contains multiple vsm and null vsm.', function () {
            var volumes = [
                {},
                {virtualStorageMachineInformation: {virtualStorageMachineId: 'e'}},
                {virtualStorageMachineInformation: {virtualStorageMachineId: 'e'}}
            ];

            var result = attachVolumeService.isMultipleVsm(volumes);
            expect(result).toBeTruthy();
        });

        it('returns false if the argument does not contains vsm.', function () {
            var volumes = [
                {},
                {},
                {},
            ];

            var result = attachVolumeService.isMultipleVsm(volumes);
            expect(result).toBeFalsy();
        });

        it('returns true if the argument contains multiple vsms.', function () {
            var volumes = [
                {virtualStorageMachineInformation: {virtualStorageMachineId: 'a'}},
                {virtualStorageMachineInformation: {virtualStorageMachineId: 'b'}}
            ];

            var result = attachVolumeService.isMultipleVsm(volumes);
            expect(result).toBeTruthy();
        });
    });
});
