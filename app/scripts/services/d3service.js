'use strict';

/**
 * @ngdoc service
 * @name rainierApp.d3service
 * @description
 * # d3service
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('d3service', function ($q, $window) {
        var d = $q.defer();
        d.resolve($window.d3);
        return {
            d3: function () {
                return d.promise;
            }
        };
    });
