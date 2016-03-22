'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:PermissionsSearch
 * @function
 * @description
 * # PermissionsSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('permissionsSearch', function () {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var array = _.filter(input, function (item) {

                var pass = _.isEmpty(search.freeText) ||
                    item.id.toString().indexOf(search.freeText) > -1 ||
                    item.label.toLocaleLowerCase().indexOf(search.freeText.toLocaleLowerCase()) > -1;

                pass = pass && (search.permission === null || search.permission === _.first(item.metaData).detailsNoSlash[1]);

                pass = item.selected || pass;
                return pass;
            });
            return array;
        };
    });