'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:alertSearch
 * @function
 * @description
 * # alertSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('alertSearch', function () {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var array = _.filter(input, function (item) {
                var pass = _.isEmpty(search.freeText) ||
                    item.storageSerialNumber.toString().indexOf(search.freeText) > -1;


                if (search.filterStorageSystem && search.filterAlertLevel) {
                    pass = pass &&
                    item.storageSerialNumber === search.filterStorageSystem &&
                    item.alertLevel === search.filterAlertLevel.toLowerCase();
                }
                else if (search.filterStorageSystem) {
                    pass = pass && item.storageSerialNumber === search.filterStorageSystem;
                }
                else if (search.filterAlertLevel) {
                    pass = pass && item.alertLevel === search.filterAlertLevel.toLowerCase();
                }
                return pass;
            });
            return array;
        };
    });
