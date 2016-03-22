'use strict';

describe('Service: diskSizeService tests', function() {
    beforeEach(module('rainierApp'));

    var diskSizeService;

    beforeEach(inject(function($injector) {
        diskSizeService = $injector.get('diskSizeService');
    }));

    describe('getDisplaySpeed tests', function() {
        it('returns speed with units correctly', function() {
            expect(diskSizeService.getDisplaySpeed(2000)).toEqual('2k');
            expect(diskSizeService.getDisplaySpeed(0)).toEqual('');
        });
    });
});
