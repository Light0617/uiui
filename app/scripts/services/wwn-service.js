'use strict';

/**
 * @ngdoc service
 * @name rainierApp.wwnService
 * @description
 * # wwnService
 * Provider in the rainierApp.
 */

angular.module('rainierApp').factory('wwnService', function() {
    var service = {
        appendColon: function (wwn) {
            if(wwn.match(/[:.-]/)){
                return wwn;
            }
            var result = '';
            for (var i = 0; i < wwn.length; i++ ) {
                result += wwn.charAt(i);
                if(i % 2){
                    result += ':';
                }
            }
            result = result.substr(0, result.length - 1);
            return result;
        },

        removeSymbol: function (displayWWN) {
            return displayWWN.replace(/[:.-]/g, '');
        },

        displayWWNs: function (wwns) {
            var result = [];
            _.each(wwns, function (wwn) {
                result.push(service.appendColon(wwn));
            });
            return result;
        },

        rawWWNs: function (wwns) {
            var result = [];
            _.each(wwns, function (wwn) {
                result.push(service.removeSymbol(wwn));
            });
            return result;
        }
    };
    return service;
});