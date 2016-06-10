'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:validateIp
 * @description
 * # validate whether the input is IP Address
 */
angular.module('rainierApp')
    .directive('validateIp', function (validateIpService) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attr, ngModel) {
                function validateIP(value) {
                    ngModel.$setValidity('IP', validateIpService.isIP(value));

                    return value;
                }
                ngModel.$parsers.push(validateIP);
            }
        };
    });
