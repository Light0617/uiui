'use strict';

/**
 * @ngdoc service
 * @name rainierApp.donutService
 * @description
 * # donutService
 * Factory in the rainierApp.
 */
angular.module('rainierApp').factory('donutService', function () {
    return {
        hostSummary: function () {
            return {
                colors: ['#7bc142', '#bcda89', '#2e464c', '#5c8793', '#1692ae', '#29abc0', '#7a9ea7',
                    '#47aa47', '#c5d246', '#307539', '#42b766', '#5cc1a3', '#84b3c6', '#0c4f12'],
                data: [],
                showDataValue: true,
                cornerRadius: 5
            };
        }
    };
});