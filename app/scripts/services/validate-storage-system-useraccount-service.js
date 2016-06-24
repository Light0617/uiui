'use strict';

/**
 * @ngdoc factory
 * @name rainierApp.validateStorageSystemUserAccountService
 * @description
 * # validate the username and password of storage system
 */

angular.module('rainierApp')
    .factory('validateStorageSystemUserAccountService', function () {

        var validPatternForUsernameAndPassword = /^[0-9a-zA-Z\-\.@_]*$/;
        var maxLengthOfUsernameAndPassword = 63;

        return {
            isValidUserName: function (value) {
                return value.length <= maxLengthOfUsernameAndPassword && validPatternForUsernameAndPassword.test(value);
            },

            isValidPassword: function (value) {
                return value.length <= maxLengthOfUsernameAndPassword && validPatternForUsernameAndPassword.test(value);
            }
        };
    });
