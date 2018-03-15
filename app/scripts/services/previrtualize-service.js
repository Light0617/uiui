/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

angular.module('rainierApp')
    .factory('previrtualizeService', function (
        $q
    ) {
        var previrtualize = function (storageSystemId, payload) {
            return $q.resolve('something');
        };

        var discover = function() {

        };

        var preVirtualizeAndDiscover = function () {

        };

        return {
            previrtualize: previrtualize,
            preVirtualizeAndDiscover: preVirtualizeAndDiscover
        };
    });
