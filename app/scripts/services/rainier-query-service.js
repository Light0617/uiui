/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc service
 * @name rainierApp.rainierQueryService
 * @description
 * # rainierQueryService
 * Provider in the rainierApp.
 */
angular.module('rainierApp')
    .factory('rainierQueryService', function () {
        return {
            and: function(key, values) {
                var keyval = _.chain(values)
                    .map(function(v) {return key + ':' + v;})
                    .value()
                    .join('+');
                return '?q=(' + keyval + ')';
            }
        };
    });
