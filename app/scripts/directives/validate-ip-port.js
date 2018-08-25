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
                ngModel.translationData = { _0 : 1, _1 : 65535 };

                function validateIPPort(value) {
                    ngModel.$setValidity('IP-PORT', /^\d+$/.test(value) && (ngModel.translationData._0 <= value) && (value <= ngModel.translationData._1));

                    return value;
                }

                ngModel.$parsers.push(validateIPPort);
            }
        };
    });