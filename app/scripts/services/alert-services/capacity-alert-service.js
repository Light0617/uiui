'use strict';

/**
 * @ngdoc service
 * @name rainierApp.capacityAlertService
 * @description
 * # capacity alert service
 * Factory in the rainierApp.
 */
angular.module('rainierApp').factory('capacityAlertService', function (monitoringService, synchronousTranslateService) {
    var service = {
        alertCount: 0,
        infoCount: 0,
        additionalClass: 'capacity alert-tile-capacity-bkg',
        serviceId: 'capacity',
        title: synchronousTranslateService.translate('capacity-alerts-title'),
        tooltip: synchronousTranslateService.translate('capacity-alerts-tooltip'),
        clickAction: function () {
            monitoringService.launchMonitoring('capacity', service.alertCount);
        }
    };

    monitoringService.getSummaryStatus(function (result) {
        service.alertCount = result.capacityAlertTotals.totalComponentWiseCapacityAlerts;
        service.infoCount = result.capacityAlertTotals.totalComponentWiseCapacityAlerts;
    });

    return service;
});
