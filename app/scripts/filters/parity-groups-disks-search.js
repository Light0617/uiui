'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:parityGroupsDisksSearch
 * @function
 * @description
 * # parityGroupsDisksSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('parityGroupsDisksSearch', function ($filter, diskSizeService) {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var totalMin = diskSizeService.createDisplaySize(search.totalCapacity.min, search.totalCapacity.unit);
            var totalMax = diskSizeService.createDisplaySize(search.totalCapacity.max, search.totalCapacity.unit);

            var array = _.filter(input, function (item) {

                var pass = (item.capacityInBytes >= totalMin.value) &&
                    (item.capacityInBytes <= totalMax.value) &&
                    (_.isEmpty(search.type) || search.type === item.type) &&
                    (_.isEmpty(search.speed) || search.speed === item.speed.toString()) &&
                    (_.isEmpty(search.purpose) || search.purpose === item.purpose) &&
                    (_.isEmpty(search.freeText) ||
                    item.diskId.indexOf(search.freeText) > -1);

                pass = item.selected || pass;
                return pass;

            });
            return array;
        };
    });
