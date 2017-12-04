'use strict';

/**
 * @ngdoc factory
 * @name rainierApp.utilService
 * @description
 * # utility service
 */

angular.module('rainierApp')
    .factory('utilService', function () {
        return {
            isNullOrUndef: function (value) {
                return _.isNull(value) || _.isUndefined(value);
            }
        };
    });
