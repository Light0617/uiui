'use strict';

/**
 * @ngdoc service
 * @name rainierApp.fileParserService
 * @description
 * # fileParserService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('fileParserService', function ($q, $window) {

        return {
            parseCsv: function (file) {
                var d = $q.defer();
                $window.Papa.parse(file, {
                    header: true,
                    worker: false,
                    complete: function (result) {
                        d.resolve(result.data);
                    },
                    error: function (err) {
                        d.reject(err);
                    }
                });
                return d.promise;
            }
        };
    });