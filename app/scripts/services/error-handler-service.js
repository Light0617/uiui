/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc service
 * @name rainierApp.errorHandlerService
 * @description
 * # errorHandlerService
 * Factory in the rainierApp.
 */
angular.module('rainierApp').factory('errorHandlerService', function (
    $modal, synchronousTranslateService, utilService
) {

    var openErrorDialog = function (messageKey) {
        if(utilService.isNullOrUndef(messageKey)) {
            messageKey = 'common-api-fetch-error';
        }
        var modalInstance = $modal.open({
            templateUrl: 'views/templates/error-modal.html',
            windowClass: 'modal fade confirmation',
            backdropClass: 'modal-backdrop',
            controller: function ($scope) {
                $scope.error = {
                    title: synchronousTranslateService.translate('error-message-title'),
                    message: synchronousTranslateService.translate(messageKey)
                };
                $scope.cancel = function () {
                    modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                };

                modalInstance.result.finally(function () {
                    modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                });
            }
        });
    };

    return {
        openErrorDialog: openErrorDialog
    };
});
