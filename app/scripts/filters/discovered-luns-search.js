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
            var filtered = input;
            if (search && search.freeText && search.freeText.length) {
                filtered = _.filter(filtered, function (item) {
                    return item.searchKey.indexOf(search.freeText) !== -1;
                });
            }
            if (search && search.vendor && search.vendor.length) {
                filtered = _.filter(filtered, function (item) {
                    return item.vendorId === search.vendor;
                });
            }
            if (search && search.serialNumber && search.serialNumber.length) {
                filtered = _.filter(filtered, function (item) {
                    return item.serialNumber === search.serialNumber;
                });
            }
            if (search && search.mapped && search.mapped.length) {
                var filterValue = search.mapped === 'YES';
                filtered = _.filter(filtered, function (item) {
                    return item.mapped === filterValue;
                });
            }
            return filtered;
        };
    });
