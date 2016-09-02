'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:virtualStorageMachineSearch
 * @function
 * @description
 * # virtualStorageMachineSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('virtualStorageMachineSearch', function () {
        return function (input, search) {
            if (!search) {
                return input;
            }
            var array = _.filter(input, function (item) {
                var pass = item.storageSystemId.toString().indexOf(search.freeText) > -1;
                return pass;

            });
            return  array;
        };
    });
