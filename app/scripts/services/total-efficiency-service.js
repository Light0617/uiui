'use strict';

/**
 * @ngdoc factory
 * @name rainierApp.totalEfficiecnyService
 * @description
 * # service for Total Efficiecny
 */

angular.module('rainierApp')
    .factory('totalEfficiencyService', function (constantService, utilService, synchronousTranslateService) {

        function transformToBoxChartData(rate) {
            return {
                radius: 75,
                numerator: 1,
                denominator: rate,
                numeratorColor: '#265CB3',
                denominatorColor: '#66A2FF'
            };
        }

        return {
            getDisplayValue: function (model) {
                if (utilService.isNullOrUndef(model)) {
                    return null;
                }

                switch (model.status) {
                    case constantService.CALCULATED:
                        return model.value;
                    case constantService.CALCULATED_WITH_EXCEEDED:
                        return '> ' + model.value;
                    case constantService.CALCULATION_IN_PROGRESS:
                        return synchronousTranslateService.translate('total-efficiency-calculation-in-progress');
                    default:
                        return constantService.HYPHEN;
                }
            },
            getBoxChartValue: function (model) {
                if (utilService.isNullOrUndef(model)) {
                    return null;
                }
                switch (model.status) {
                    case constantService.CALCULATED:
                    case constantService.CALCULATED_WITH_EXCEEDED:
                        return transformToBoxChartData(model.value);
                    default:
                        return null;
                }
            },
            getPeriodValue: function (value) {
                switch (value) {
                    case constantService.CALCULATION_IN_PROGRESS:
                        return null;
                    default:
                        return value;
                }
            }
        };
    });
