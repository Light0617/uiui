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
 * @name rainierApp.detachVolumeService
 * @description
 * # detachVolumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('detachVolumeService', function (
        $modal, synchronousTranslateService
    ) {
        return {
            openDetachMultipleProtocolServersErrorModal: function() {
                var modalInstance = $modal.open({
                    templateUrl: 'views/templates/error-modal.html',
                    windowClass: 'modal fade confirmation',
                    backdropClass: 'modal-backdrop',
                    controller: function ($scope) {
                        $scope.error = {
                            title: synchronousTranslateService.translate('error-message-title'),
                            // message: synchronousTranslateService.translate('storage-volume-detach-different-protocol-servers')
                            message: 'Cannot detach volumes from different protocol servers.'
                        };
                        $scope.cancel = function () {
                            modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                        };

                        modalInstance.result.finally(function() {
                            modalInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                        });
                    }
                });
            }
        };
    });
