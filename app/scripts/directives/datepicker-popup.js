'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:datepickerPopup
 * @description
 * # datepickerPopup
 * Workaround for https://github.com/angular-ui/bootstrap/issues/2659
 * source : http://stackoverflow.com/questions/25742445/angularjs-1-3-datepicker-initial-format-is-incorrect
 */
angular.module('rainierApp')
    .directive('datepickerPopup', function (dateFilter, datepickerPopupConfig) {
        return {
            restrict: 'A',
            priority: 1,
            require: 'ngModel',
            link: function (scope, element, attr, ngModel) {
                var dateFormat = attr.datepickerPopup || datepickerPopupConfig.datepickerPopup;
                ngModel.$formatters.push(function (value) {
                    return dateFilter(value, dateFormat);
                });
            }
        };
    });
