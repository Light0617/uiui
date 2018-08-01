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
 * @name rainierApp.createVsmService
 * @description
 * # createVsmService
 * Factory in the rainierApp.
 */
angular.module('rainierApp').factory('createVsmService', function (
    $modal, synchronousTranslateService, $q) {

    var RAID500_600_700 = {min: 1, max: 99999};
    var HM700 = {min: 200001, max: 299999};
    var RAID800_850 = {min: 300001, max: 399999};
    var HM800_850 = {min: 400001, max: 499999};

    var vsmModelRange = {
        VSP_F900: HM800_850,
        VSP_G900: HM800_850,
        VSP_F700: HM800_850,
        VSP_G700: HM800_850,
        VSP_F370: HM800_850,
        VSP_G370: HM800_850,
        VSP_F350: HM800_850,
        VSP_G350: HM800_850,
        VSP_F800_AND_VSP_G800: HM800_850,
        VSP_F400_F600_AND_VSP_G400_G600: HM800_850,
        VSP_G200: HM800_850,
        HUS_VM: HM700,
        VSP_F1500_AND_VSP_G1000_G1500: HM800_850,
        VSP: RAID500_600_700,
        USP_VM: RAID500_600_700,
        USP_V: RAID500_600_700,
        NSC: RAID500_600_700,
        USP: RAID500_600_700
    };

    var openErrorDialog = function (message) {
        var modalInstance = $modal.open({
            templateUrl: 'views/templates/error-modal.html',
            windowClass: 'modal fade confirmation',
            backdropClass: 'modal-backdrop',
            controller: function ($scope) {
                $scope.error = {
                    title: synchronousTranslateService.translate('error-message-title'),
                    message: message
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

    var checkVirtualSerialNumber = function (selectedStorageSystemIds, specifiedSerialNumber) {
        if(_.contains(selectedStorageSystemIds, specifiedSerialNumber)) {
            return $q.reject('The serial number can`t be the same as one of the selected storage system ids');
        }
        return $q.resolve(true);
    };

    return {
        vsmModelRange: vsmModelRange,
        openErrorDialog: openErrorDialog,
        checkVirtualSerialNumber: checkVirtualSerialNumber
    };
});
