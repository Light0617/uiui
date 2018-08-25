'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:validateStorageSystemUsername, rainierApp.directive:validateStorageSystemUserPassword
 * @description
 * # validate the username and password of storage system
 */
angular.module('rainierApp')
    .directive('validateStorageSystemUsername', function (validateStorageSystemUserAccountService) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attr, ngModel) {
                function validateUserName(value) {
                    ngModel.$setValidity('username', validateStorageSystemUserAccountService.isValidUserName(value));

                    return value;
                }
                ngModel.$parsers.push(validateUserName);
            }
        };
    })
    .directive('validateStorageSystemPassword', function (validateStorageSystemUserAccountService) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attr, ngModel) {
                function validatePassword(value) {
                    ngModel.$setValidity('password', validateStorageSystemUserAccountService.isValidPassword(value));

                    return value;
                }
                ngModel.$parsers.push(validatePassword);
            }
        };
    });
