'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:storagePoolSearch
 * @function
 * @description
 * # storagePoolSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('storagePoolSearch', function ($filter, diskSizeService) {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var freeMinSize = diskSizeService.createDisplaySize(search.freeCapacity.min, search.freeCapacity.unit);
            var freeMaxSize = diskSizeService.createDisplaySize(search.freeCapacity.max, search.freeCapacity.unit);


            var totalMinSize = diskSizeService.createDisplaySize(search.totalCapacity.min, search.totalCapacity.unit);
            var totalMaxSize = diskSizeService.createDisplaySize(search.totalCapacity.max, search.totalCapacity.unit);

            var array = _.filter(input, function (item) {

                var pass = _.isEmpty(search.freeText) ||
                    item.storagePoolId.toString().indexOf(search.freeText) > -1 ||
                    item.label.toLocaleLowerCase().indexOf(search.freeText.toLocaleLowerCase()) > -1;

                pass = pass &&
                item.availableCapacityInBytes.value >= freeMinSize.value &&
                item.availableCapacityInBytes.value <= freeMaxSize.value &&
                item.capacityInBytes.value >= totalMinSize.value &&
                item.capacityInBytes.value <= totalMaxSize.value &&
                (item.type === search.poolType || !search.poolType) &&
                (item.activeFlashEnabled === search.activeFlashEnabled || !search.activeFlashEnabled);

                pass = pass && (!search.poolTier || (_.some(item.tiers, function(t) {
                    return !search.poolTier || t.tier === search.poolTier;
                })));

                pass = item.selected || pass;
                return pass;

            });
            return  array;
        };
    });