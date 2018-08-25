'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:storagePoolSearch
 * @function
 * @description
 * # storagePoolSearch
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('evsSearch', function () {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var array = _.filter(input, function (item) {

                var pass = _.isEmpty(search.freeText) ||
                    item.uuid.toString().indexOf(search.freeText) > -1 ||
                    item.name.toLocaleLowerCase().indexOf(search.freeText.toLocaleLowerCase()) > -1 ||
                    _.find(item.interfaceAddresses, function (address) {
                        return address.ip.toString().indexOf(search.freeText) > -1;
                    });

                pass = pass && (search.isOnline === null || item.isOnline === search.isOnline);

                pass = pass && (search.isEnabled === null || item.enabled === search.isEnabled);
                
                pass = pass && (search.bladeSelected.length === 0 || search.bladeSelected.includes(item.clusterNodeId));

                pass = pass && (!search.filterStorageSystem || item.storageSystemId === search.filterStorageSystem);

                pass = item.selected || pass;
                return pass;
            });
            return array;
        };
    });