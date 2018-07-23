/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:validateSerialNumber
 * @description
 */

angular.module('rainierApp')
    .directive('validateSerialNumber', function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function($scope, element, attr, ngModel) {

                function validateNumber(value) {
                    var range = $scope.dataModel.placeholder;
                    var validNumber = true;

                    if(value === "") {
                        validNumber = true;
                    }

                    else if(value >= range[0] && value <= range[1]) {
                        validNumber = true;
                    }
                    else {
                        validNumber = false;
                    }

                    ngModel.$setValidity('number', validNumber);

                    return value;
                }

                ngModel.$parsers.push(validateNumber);
            }
        };
    });