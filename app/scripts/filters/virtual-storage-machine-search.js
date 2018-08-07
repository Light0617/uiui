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
                var storageSystemId = item.storageSystemId.toString().indexOf(search.freeText) > -1;
                var virtualStorageMachineId = item.virtualStorageMachineId !== null ?
                    item.virtualStorageMachineId.toString().toLowerCase().indexOf(
                        search.freeText.toString().toLowerCase()) > -1 : false;
                var model = item.model !== null ? item.model.toString().toLowerCase().indexOf(
                    search.freeText.toString().toLowerCase()) > -1 : false;
                return storageSystemId || model || virtualStorageMachineId;

            });
            return  array;
        };
    });
