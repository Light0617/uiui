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
 * @name rainierApp.filter:virtualStorageMachineDetailsSearch
 * @function
 * @description
 * # virtualStorageMachineDetailsSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('virtualStorageMachineDetailsSearch', function () {
        return function (input, search) {
            if (!search) {
                return input;
            }
            var array = _.filter(input, function (item) {
                var id = item.storageSystemId === null ? false : (item.storageSystemId.toString().indexOf(search.freeText) > -1);
                var name = item.storageSystemName === null ? false : (item.storageSystemName.toString().indexOf(search.freeText) > -1);
                var ip = item.svpIpAddress === null ? false : (item.svpIpAddress.toString().indexOf(search.freeText) > -1);
                var model = item.model === null ? false : (item.model.toString().indexOf(search.freeText) > -1);
                return id || name || ip || model;

            });
            return  array;
        };
    });
