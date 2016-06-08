'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:validateIpPort
 * @description
 * # validate whether the input is Port Number
 */
angular.module('rainierApp')
    .directive('validateIpPort', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attr, ngModel) {
                function validateIPPort(value) {
                    var num = Number(value);

                    ngModel.$setValidity('IP-PORT', /^\d+$/.test(String(value)) && (0 < num) && (num < 65536));

                    return value;
                }
                ngModel.$parsers.push(validateIPPort);
            }
        };
    });