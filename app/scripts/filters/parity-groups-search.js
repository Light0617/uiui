'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:parityGroupsSearch
 * @function
 * @description
 * # parityGroupsSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('parityGroupsSearch', function ($filter, diskSizeService) {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var freeTextInput = $filter('filter')(input, {
                'parityGroupId': search.freeText,
            }, false);

            var selectedInput = $filter('filter')(input, {
                'selected': true,
            }, false);

            input = _.union(freeTextInput, selectedInput);

            var totalMin = diskSizeService.createDisplaySize(search.totalCapacity.min, search.totalCapacity.unit);
            var totalMax = diskSizeService.createDisplaySize(search.totalCapacity.max, search.totalCapacity.unit);

            return _.filter(input, function (item) {

                //diskType search filter
                var diskType = item.diskSpec.type;
                var diskSpeed = item.diskSpec.speed;
                var diskSize = diskSizeService.getDisplaySize(item.diskSpec.capacityInBytes);

                var diskConfig;
                if (diskSpeed !== '0k') {
                    diskConfig = (diskType + ' ' + diskSpeed + ' ' + diskSize.size + diskSize.unit);
                } else {
                    diskConfig = (diskType + ' ' + diskSize.size + diskSize.unit);
                }
                item.disk = diskConfig;

                //raidConfig search filter

                var raidConfig = item.raidLevel + ' ' + item.raidLayout;
                item.raid = raidConfig;

                var pass =
                    item.totalCapacityInBytes >= totalMin.value &&
                    item.totalCapacityInBytes <= totalMax.value &&
                    (item.disk === search.disk || !search.disk) &&
                    (item.raid === search.raid || !search.raid ) &&
                    (item.status === search.status || !search.status);

                pass = item.selected || pass;
                return pass;

            });
        };
    });
