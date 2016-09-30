'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:storageSystemSearch
 * @function
 * @description
 * # storageSystemSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('storageSystemSearch', function ($filter, diskSizeService) {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var freeMinSize = diskSizeService.createDisplaySize(search.freeCapacity.min, search.freeCapacity.unit);
            var freeMaxSize = diskSizeService.createDisplaySize(search.freeCapacity.max, search.freeCapacity.unit);


            var totalMinSize = diskSizeService.createDisplaySize(search.totalCapacity.min, search.totalCapacity.unit);
            var totalMaxSize = diskSizeService.createDisplaySize(search.totalCapacity.max, search.totalCapacity.unit);

            var array = _.filter(input, function (item) {
                var matchedCapacity = item.physicalFree.value >= freeMinSize.value &&
                    item.physicalFree.value <= freeMaxSize.value &&
                    item.total.value >= totalMinSize.value &&
                    item.total.value <= totalMaxSize.value;

                var matchedSymbol = item.storageSystemId.toString().indexOf(search.freeText) > -1 ||
                    item.svpIpAddress.toString().indexOf(search.freeText) > -1 ||
                    item.storageSystemName.toString().toLowerCase().indexOf(search.freeText.toString().toLowerCase()) > -1 ||
                    item.model.toString().toLowerCase().indexOf(search.freeText.toString().toLowerCase()) > -1;

                return item.selected || (matchedCapacity && matchedSymbol);
            });
            return  array;
        };
    });
