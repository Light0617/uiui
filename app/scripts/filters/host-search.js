'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:hostSearch
 * @function
 * @description
 * # hostSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('hostSearch', function ($filter) {
        function osTypeFilter(typelist, host) {
            if (typelist === null || typelist === undefined || typelist.length === 0) {
                return true;
            }
            else {
                var result = (host.osType === typelist[0]);
                for (var i = 1; i < typelist.length; ++i) {
                    result = result || (host.osType === typelist[i]);
                }
                return result;
            }
        }

        return function (input, search) {
            if (!search) {
                return input;
            }
            var freeTextInput = $filter('filter')(input, {
                '$': search.freeText,
            }, false);

            var selectedInput = $filter('filter')(input, {
                'selected': true,
            }, false);

            input = _.union(freeTextInput, selectedInput);

            var array = _.filter(input, function (item) {
                var pass = !(search.status && item.status !== search.status);
                pass = pass && osTypeFilter(search.osType, item);

                var isFilter = function(criteria) {
                    return _.isArray(criteria) && _.size(criteria)> 0;
                };

                if (isFilter(search.replicationTypes)) {
                    pass = pass &&
                        _.isArray(item.dpType) &&
                        _.size(_.intersection(item.dpType, search.replicationTypes)) > 0;
                }

                pass = item.selected || pass;

                return pass;
            });
            return  array;
        };
    });
