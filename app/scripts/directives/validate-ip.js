'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:validateIp
 * @description
 * # validate whether the input is IP Address
 */
angular.module('rainierApp')
    .directive('validateIp', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attr, ngModel) {
                function validateIP(value) {
                    var isIPv4 = $.validator.methods.ipv4.call($.validator.prototype, value, element.context);
                    var isIPv6 = $.validator.methods.ipv6.call($.validator.prototype, value, element.context);

                    ngModel.$setValidity('IP', isIPv4 || isIPv6 );

                    return value;
                }
                ngModel.$parsers.push(validateIP);
            }
        };
    });
