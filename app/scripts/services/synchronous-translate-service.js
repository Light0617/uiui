'use strict';

/**
 * @ngdoc service
 * @name rainierApp.synchronousTranslateService
 * @description
 * # synchronousTranslateService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('synchronousTranslateService', function ($filter) {


        var translateFilter = $filter('translate');

        return {
            translate: function (key, args) {
                return translateFilter(key, args);
            }
        };
    });
