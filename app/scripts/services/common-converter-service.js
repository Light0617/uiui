'use strict';

/**
 * @ngdoc service
 * @name rainierApp.commonConverterService
 * @description
 * # commonConverterService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('commonConverterService', function (constantService) {
        return {
            convertBooleanToString: function (item) {
                return item ? constantService.yes : constantService.no;
            }
        };
    });