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
    .filter('sharesExportsSearch', function () {
        return function (input, search) {
            if (!search) {
                return input;
            }

            var array = _.filter(input, function (item) {

                var pass = _.isEmpty(search.freeText) ||
                    item.id.toString().indexOf(search.freeText) > -1 ||
                    item.name.toLocaleLowerCase().indexOf(search.freeText.toLocaleLowerCase()) > -1;

                pass = pass && (search.type === null || item.type === search.type);
                pass = pass && (!search.filterEvs || item.evsUuid === search.filterEvs.obj.uuid);

                pass = item.selected || pass;
                return pass;
            });
            return array;
        };
    });