/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2017. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

angular.module('rainierApp')
    .factory('orchestratorService', function (
        objectTransformService,
        apiResponseHandlerService,
        orchestratorService
    ) {
        var previrtualize = function () {

        };

        var discover = function() {

        };

        return {
            previrtualize: previrtualize,
            discover: discover
        };
    });
