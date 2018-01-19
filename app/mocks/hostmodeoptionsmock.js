/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

rainierAppMock.factory('hostModeOptionsMock', function (mockUtils) {
    return {
        getMock: function() {
            return [];
        },
        handle: function(urlResult) {
            return mockUtils.response.ok(urlResult.url);
        }
    };
});