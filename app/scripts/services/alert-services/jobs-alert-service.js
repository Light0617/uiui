'use strict';

/**
 * @ngdoc service
 * @name rainierApp.jobsAlertService
 * @description
 * # jobs alert service
 * Factory in the rainierApp.
 */
angular.module('rainierApp').factory('jobsAlertService', function ($location, orchestratorService, synchronousTranslateService) {
    var service = {
        alertCount: 0,
        infoCount: 0,
        errorCount: 0,
        warnCount: 0,
        additionalClass: 'jobs alert-tile-jobs-bkg',
        serviceId: 'jobs',
        title: synchronousTranslateService.translate('jobs-alerts-title'),
        tooltip: synchronousTranslateService.translate('jobs-alerts-tooltip'),
        clickAction: function () {
            $location.path('/jobs');
        }
    };

    var now = new Date();
    var nowMinusOneDay = new Date();
    nowMinusOneDay.setDate(nowMinusOneDay.getDate() - 1);
    orchestratorService.jobsTimeSlice(nowMinusOneDay.toISOString(), now.toISOString()).then(function (result) {
        _.forEach(result.jobs, function (job) {
            if (job.parentJobId) {
                return;
            }
            if (job.status === 'SUCCESS') {
                service.infoCount += 1;
            } else if (job.status === 'SUCCESS_WITH_ERRORS') {
                service.errorCount += 1;
            } else if (job.status === 'FAILED') {
                service.warnCount += 1;
            }
        });
        service.alertCount = service.errorCount + service.warnCount;
    });
    return service;
});
