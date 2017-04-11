'use strict';

/**
 * @ngdoc service
 * @name rainierApp.versionService
 * @description
 * # versionService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('versionService', function () {
        var supportedFwVersionPrefixes = [
            '80-05-4',
            '83-04-4',
            '80-05-2',
            '83-04-2',
            '80-05-0',
            '83-04-0',
            '80-04-2',
            '83-03-2',
            '80-04-0',
            '83-03-0'];
        return {
            isStorageSystemVersionSupported: function (version) {
                if(_.isEmpty(version)){
                    return true;
                }

                version = version.substring(0, 7);
                for (var i in supportedFwVersionPrefixes){
                    if (supportedFwVersionPrefixes[i] === version){
                        return true;
                    }
                }

                return false;
            }
        };
    });
