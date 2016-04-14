'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:createPoolParityGroupsFilter
 * @function
 * @description
 * # parityGroupsSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('createPoolParityGroupsFilter', function($filter) {
        return function(input, search) {
            if (!search) {
                return input;
            }
            var freeTextInput = $filter('filter')(input, {
                'parityGroupId': search.freeText
            }, false);

            var selectedInput = $filter('filter')(input, {
                'selected': true,
            }, false);

            input = _.union(freeTextInput, selectedInput);
            var diskSpeed = search.diskSpec.speed;
            if (search.diskSpec.speed === '0') {
                diskSpeed = '';
            }

            var array = _.filter(input, function(item) {
                var pass = (_.isEmpty(search.diskSpec.type) || search.diskSpec.type === item.diskSpec.type) &&
                    (_.isEmpty(search.diskSpec.speed) || diskSpeed === item.diskSpec.speed) &&
                    (_.isEmpty(search.raidLayout) || search.raidLayout === item.raidLayout) &&
                    (_.isEmpty(search.raidLevel) || search.raidLevel === item.raidLevel) &&
                    (search.compression === null || search.compression === item.compression) &&
                    (search.encryption === null || search.encryption === item.encryption);

                pass = item.selected || pass;

                return pass;

            });
            return array;
        };
    });
