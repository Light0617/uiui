'use strict';

/**
 * @ngdoc service
 * @name rainierApp.dpAlertService
 * @description
 * # data protection alert service
 * Factory in the rainierApp.
 */
angular.module('rainierApp').factory('dpAlertService', function (monitoringService, synchronousTranslateService) {
    var updateCounts = function () {
        monitoringService.getDpAlerts(function (result) {
            service.alertCount = result.total;
            service.infoCount = result.total;
        });
    };
    var service = {
        alertCount: 0,
        infoCount: 0,
        additionalClass: 'data-protection alert-tile-data-protection-bkg',
        serviceId: 'capacity',
        title: synchronousTranslateService.translate('dp-alerts-title'),
        tooltip: synchronousTranslateService.translate('dp-alerts-tooltip'),
        clickAction: function () {
            monitoringService.launchDpMonitoring(service.alertCount);
        },
        update: updateCounts
    };

    return service;
});
