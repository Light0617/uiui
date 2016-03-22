'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:storagePortSearch
 * @function
 * @description
 * # storagePortSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('storagePortSearch', function () {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var array = _.filter(input, function (item) {
                var pass = (!search.portSpeed || item.speed === search.portSpeed)&&
                    (search.securitySwitchEnabled === null ||
                        search.securitySwitchEnabled === undefined ||
                        item.securitySwitchEnabled === search.securitySwitchEnabled) &&
                    (_.isEmpty(search.freeText) ||
                    item.storagePortId.toString().indexOf(search.freeText) > -1) &&
                    ($.inArray(search.portAttribute, item.attributes) > -1 || !search.portAttribute);
                pass = item.selected || pass;
                return pass;

            });
            return  array;
        };
    });
