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
    .filter('replicationGroupsSearch', function () {

        return function (input, search) {
            if (!search) {
                return input;
            }

            return _.filter(input, function (item) {
                var pass = (_.isEmpty(search.freeText) ||
                    (item.name.toString().toLocaleLowerCase() === search.freeText.toString().toLocaleLowerCase())) &&
                    (!search.type || item.type.toString().toLocaleLowerCase() === search.type.toString().toLocaleLowerCase());

                pass = item.selected || pass;
                return pass;
            });
        };
    });
