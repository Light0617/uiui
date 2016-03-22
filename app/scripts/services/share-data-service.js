'use strict';

/**
 * @ngdoc service
 * @name rainierApp.ShareDataService
 * @description
 * # ShareDataService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('ShareDataService', function () {
        return {
            push: function (key, value) {
                this[key] = value;
            },
            pop: function (key) {
                var value = this[key];
                if (value) {
                    delete this[key];
                }
                return value;
            }
        };
    });