'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:snmpManagerSearch
 * @function
 * @description
 * #snmpManagerSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('snmpManagerSearch', function () {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var array = _.filter(input, function (item) {

                var pass = (!search.authProtocol || item.authProtocol === search.authProtocol) &&
                    (!search.privacyProtocol || item.privacyProtocol === search.privacyProtocol) &&
                    (_.isEmpty(search.freeText) ||
                    item.name.indexOf(search.freeText) > -1);

                pass = item.selected || pass;
                return pass;

            });

            return array;
        };
    });
