/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:discoveredLunsSearch
 * @function
 * @description
 * # discoveredLunsSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('discoveredLunsSearch', function () {
        return function (input, search) {
            if (!search || !search.freeText.length) {
                return input;
            }
            var filtered = _.filter(input, function (item) {
                return item.searchKey.indexOf(search.freeText) !== -1;
            });
            return filtered;
        };
    });
