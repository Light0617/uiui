'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:hostDataProtectionAlert
 * @description
 * # hostDataProtectionAlert
 */
angular.module('rainierApp')
    .directive('hostDpAlert', function () {
        return {
            scope: {
                alertCount: '=ngModel',
                alertLevel: '='
            },
            templateUrl: 'views/templates/host-dp-alert.html',
            restrict: 'E',
            replace: true
        };
    });
