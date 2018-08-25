'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:storageSystemVolumesSearch
 * @function
 * @description
 * # storageSystemVolumesSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('storageSystemVolumesSearch', function ($filter, diskSizeService) {
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
                    item.volumeId.toString().indexOf(search.freeText) > -1 ||
                    item.label.toLocaleLowerCase().indexOf(search.freeText.toLocaleLowerCase()) > -1;

                 pass = pass &&
                    !(search.type && item.type !== search.type) &&
                    (item.provisioningStatus === search.provisioningStatus || !search.provisioningStatus) &&
                    item.availableCapacity.value >= freeMinSize.value &&
                    item.availableCapacity.value <= freeMaxSize.value &&
                    item.totalCapacity.value >= totalMinSize.value &&
                    item.totalCapacity.value <= totalMaxSize.value &&
                    item.usagePercentage >= search.utilization.min &&
                    item.usagePercentage <= search.utilization.max;

                var isFilter = function(criteria) {
                    return _.isArray(criteria) && _.size(criteria)> 0;
                };

                if (isFilter(search.replicationTypes)) {
                    pass = pass &&
                        _.size(_.intersection(item.dataProtectionSummary.replicationType, search.replicationTypes)) > 0;
                }

                if (isFilter(search.protectionStatusList)) {
                    pass = pass &&
                        _.size(_.intersection(item.dataProtectionSummary.volumeType, search.protectionStatusList)) > 0;
                }

                pass = item.selected || pass;

                return pass;

            });
            return  array;
        };
    });
