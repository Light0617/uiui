'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:fabricSwitchSearch
 * @function
 * @description
 * # fabricSwitchSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('fabricSwitchSearch', function ($filter) {
        return function (input, search) {
            if (!search){
                return input;
            }

            var freeTextInput = $filter('filter')(input, {
                'sanFabricId': search.freeText,
            }, false);

            var selectedInput = $filter('filter')(input, {
                'selected': true,
            }, false);

            input = _.union(freeTextInput, selectedInput);

            var switchType = search.switchType;

            return _.filter(input, function (item) {

                var pass = (item.switchType === switchType || !switchType);

                pass = item.selected || pass;

                return pass;
            });
        };
    });