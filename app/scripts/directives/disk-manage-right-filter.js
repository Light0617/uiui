'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:diskManageRightFilter
 * @description
 * # diskManageRightFilter
 */
angular.module('rainierApp')
    .directive('diskManageRightFilter', function () {
        return {
            scope: {
                model: '=ngModel',
                select: '&'
            },
            templateUrl: 'views/templates/disk-manage-right-filter.html',
            restrict: 'E'
        };
    });
