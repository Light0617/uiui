'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:externalParityGroupsSearch
 * @function
 * @description
 * # externalParityGroupsSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('externalParityGroupsSearch', function ($filter, diskSizeService) {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var freeTextInput = $filter('filter')(input, {
                'externalParityGroupId': search.freeText,
            }, false);

            var selectedInput = $filter('filter')(input, {
                'selected': true,
            }, false);

            input = _.union(freeTextInput, selectedInput);

            var totalMin = diskSizeService.createDisplaySize(search.totalCapacity.min, search.totalCapacity.unit);
            var totalMax = diskSizeService.createDisplaySize(search.totalCapacity.max, search.totalCapacity.unit);

            return _.filter(input, function (item) {
                var pass =
                    item.total.value >= totalMin.value &&
                    item.total.value <= totalMax.value;

                pass = item.selected || pass;
                return pass;

            });
        };
    });
