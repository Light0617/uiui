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
    .filter('discoveredLunsSearch', function (wwnService, utilService) {
        var searchLunFn = function (freeText) {
            return function (item) {
                var properties = [item.portId, item.wwn, wwnService.appendColon(item.wwn), item.lunId];

                // iscsi
                if (item.externalIscsiInformation) {
                    var iscsi = item.externalIscsiInformation;
                    properties.push(iscsi.ipAddress);
                    properties.push(iscsi.iscsiName);
                }

                var index = _.filter(properties, function (i) {
                    return !utilService.isNullOrUndef(i);
                }).join(' ');

                return index.indexOf(freeText) !== -1;
            };
        };

        return function (input, search) {
            if (!search || !search.freeText.length) {
                return input;
            }
            var filtered = _.filter(input, searchLunFn(search.freeText));
            return filtered;
        };
    });
