'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:failureVolumesSearch
 * @function
 * @description
 * # failureVolumesSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('failureVolumesSearch', function ($filter) {

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
                var pass = true;

                var isFilter = function(criteria) {
                    return _.isArray(criteria) && _.size(criteria)> 0;
                };

                if (isFilter(search.replicationTypes)) {
                    pass = pass &&
                        _.size(_.intersection(item.dataProtectionSummary.replicationType, search.replicationTypes)) > 0;
                }

                pass = item.selected || pass;

                return pass;
            });
            return  array;
        };
    });
