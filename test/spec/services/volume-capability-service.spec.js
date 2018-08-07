/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

describe('Service: volumeCapabilitiesService tests', function () {
    var volumeCapabilitiesService;

    beforeEach(function () {
        module('rainierApp');
    });

    beforeEach(inject(function (_volumeCapabilitiesService_) {
        volumeCapabilitiesService = _volumeCapabilitiesService_;
    }));

    describe('getValidVolumeLabelInfo', function () {
        it('returns new label pattern when HM850 SVOS 8.3.', function () {
            expect(volumeCapabilitiesService.getValidVolumeLabelInfo('VSP G350', '88-03-00-20/00'))
                .toBe({
                    pattern: /^[ a-zA-Z0-9_.@\-\\!#$%&'()+,/:=\[\]^`{}~]+$/,
                    errMessageKey: 'invalid-volume-label-for-hm850-svos8.3'
                });
        });

        it('returns old label pattern when HM850 SVOS 8.2.', function () {
            expect(volumeCapabilitiesService.getValidVolumeLabelInfo('VSP G350', '88-02-00-20/00'))
                .toBe({
                    pattern: /^[a-zA-Z0-9_.@]([a-zA-Z0-9-_.@]*$|[ a-zA-Z0-9-_.@]*[a-zA-Z0-9-_.@]+$)/,
                    errMessageKey: 'invalid-volume-label'
                });
        });

        it('returns old lable pattern when HM800.', function () {
            expect(volumeCapabilitiesService.getValidVolumeLabelInfo('VSP G700', '83-05-20-20/00'))
                .toBe({
                    pattern: /^[a-zA-Z0-9_.@]([a-zA-Z0-9-_.@]*$|[ a-zA-Z0-9-_.@]*[a-zA-Z0-9-_.@]+$)/,
                    errMessageKey: 'invalid-volume-label'
                });
        });
    });
});
