'use strict';

/**
 * @ngdoc filter
 * @name rainierApp.filter:defaultValueFilter
 * @function
 * @description
 * # defaultValueFilter
 * Filter in the rainierApp.
 */
angular.module('rainierApp')
    .filter('default', function(utilService) {
        return function(value) {
            if (utilService.isNullOrUndefOrBlank(value)) {
                return '-';
            }
            return value;
        };
    });