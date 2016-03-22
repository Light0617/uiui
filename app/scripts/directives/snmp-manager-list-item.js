'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:fabricSwitchListItem
 * @description
 * # fabricSwitchListItem
 */
angular.module('rainierApp')
    .directive('snmpManagerListItem', function () {
        return {
            scope: {
                model: '=ngModel',
                data: '=data',
                select: '&'
            },
            templateUrl: 'views/templates/snmp-manager-list-item.html',
            restrict: 'E'
        };
    });
