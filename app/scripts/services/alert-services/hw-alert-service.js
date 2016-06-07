'use strict';

/**
 * @ngdoc service
 * @name rainierApp.hwAlertService
 * @description
 * # hardware alert service
 * Factory in the rainierApp.
 */
angular.module('rainierApp').factory('hwAlertService', function (monitoringService, synchronousTranslateService) {
    var service = {
        alertCount: 0,
        infoCount: 0,
        additionalClass: 'hardware alert-tile-hardware-bkg',
        serviceId: 'hardware',
        title: synchronousTranslateService.translate('hardware-alerts-title'),
        tooltip: synchronousTranslateService.translate('hardware-alerts-tooltip'),
        clickAction: function () {
            monitoringService.launchMonitoring('hardware', service.alertCount);
        }
    };

    monitoringService.getSummaryStatus(function (result) {
        service.alertCount = result.hardwareAlertTotals.totalComponentWiseHardwareAlerts;
        service.infoCount = result.hardwareAlertTotals.totalComponentWiseHardwareAlerts;
    });
    return service;
});
