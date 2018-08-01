/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

describe('Service: objectTransformService tests', function () {
    var objectTransformService;

    beforeEach(function () {
        module('rainierApp');
    });

    beforeEach(inject(function (_objectTransformService_) {
        objectTransformService = _objectTransformService_;
    }));

    describe('transformVolumeId', function () {
        it('returns empty value if a negative value specified.', function () {
            expect(objectTransformService.transformVolumeId(-1)).toBe('');
        });

        it('returns formatted zero if zero specified.', function () {
            expect(objectTransformService.transformVolumeId(0)).toBe('0 (00:00:00)');
        });

        it('returns formatted value if 65535 specified.', function() {
            expect(objectTransformService.transformVolumeId(65535)).toBe('65535 (00:FF:FF)');
        });

        it('returns empty value if the undefined value specified.', function () {
            expect(objectTransformService.transformVolumeId()).toBe('');
        });

        it('returns empty value if the specified value is not able to parse as int.', function () {
            expect(objectTransformService.transformVolumeId('')).toBe('');
        });
    });
});
