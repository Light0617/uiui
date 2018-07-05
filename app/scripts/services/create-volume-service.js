'use strict';

/**
 * @ngdoc service
 * @name rainierApp.createVolumeService
 * @description
 * # createVolumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('createVolumeService', function (synchronousTranslateService, orchestratorService,
                                              resourceTrackerService, $q, $modal, utilService) {

        var noVirtualizeKey = synchronousTranslateService.translate('no-virtualize');

        var createVolumes = function (storageSystemId, volumes, vsm) {
            var payload = {
                storageSystemId: storageSystemId,
                volumes: volumes,
                virtualStorageMachineId: vsm === noVirtualizeKey ? undefined : vsm
            };

            // Build reserved resources
            var reservedResourcesList = [];
            _.forEach(volumes, function (vol) {
                if (vol.poolId !== null) {
                    reservedResourcesList.push(vol.poolId + '=' + resourceTrackerService.storagePool());
                }
            });

            // Show popup if resource is present in resource tracker else submit
            resourceTrackerService.showReservedPopUpOrSubmit(
                reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                'Create Volumes Confirmation', null, null, payload, orchestratorService.createVolumes);
        };

        var warnUnmatchedCompressTechs = function (storageSystemId, volumes, vsm) {
            var modelInstance = $modal.open({
                templateUrl: 'views/templates/basic-confirmation-modal-with-solution.html',
                windowClass: 'modal fade confirmation',
                backdropClass: 'modal-backdrop',
                controller: function ($scope) {
                    $scope.confirmationTitle = synchronousTranslateService.translate(
                        'storage-volumes-add-unmatched-compress-techs');
                    $scope.confirmationMessageHeader = synchronousTranslateService.translate(
                        'storage-volumes-add-unmatched-compress-techs-message-header');
                    $scope.confirmationMessageSolution1 = synchronousTranslateService.translate(
                        'storage-volumes-add-unmatched-compress-techs-message-solution1');
                    $scope.confirmationMessageSolution2 = synchronousTranslateService.translate(
                        'storage-volumes-add-unmatched-compress-techs-message-solution2');
                    $scope.confirmationMessageFooter = synchronousTranslateService.translate(
                        'storage-volumes-add-unmatched-compress-techs-message-footer');
                    $scope.cancelButtonLabel = synchronousTranslateService.translate('common-label-cancel');
                    $scope.okButtonLabel = synchronousTranslateService.translate('common-label-ok');

                    $scope.ok = function () {
                        createVolumes(storageSystemId, volumes, vsm);
                        $scope.cancel();
                    };

                    $scope.cancel = function () {
                        modelInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                    };

                    modelInstance.result.finally(function () {
                        $scope.cancel();
                    });
                }
            });
        };

        return {
            createVolumes: createVolumes,
            validatePoolThenCreateVolumes: function(storageSystemId, volumes, vsm) {
                var targetPoolIdsWithVolumeCompression = [];
                _.forEach(volumes, function (vol) {
                    if(vol.poolId !== null && vol.dkcDataSavingType === 'COMPRESSION') {
                        if (!_.contains(targetPoolIdsWithVolumeCompression, vol.poolId)) {
                            targetPoolIdsWithVolumeCompression.push(vol.poolId);
                        }
                    }
                });

                var hasAnyPoolWhichHasAllOfPgsCompressionSupported = false;

                var checkAnyPoolWhichAllPgsCompressionEnabled = function (poolId) {
                    return orchestratorService.storagePool(storageSystemId, poolId).then(function (pool) {
                        var poolPgs = pool.parityGroups;
                        if (utilService.isNullOrUndef(poolPgs) || _.isEmpty(poolPgs)) {
                            return;
                        }

                        var isAllOfPgCompressionSupported = _.every(poolPgs, function (poolPg) {
                            return poolPg.compressionSupported;
                        });

                        if (isAllOfPgCompressionSupported) {
                            hasAnyPoolWhichHasAllOfPgsCompressionSupported = true;
                        }
                    });
                };

                var promises = [];
                _.forEach(targetPoolIdsWithVolumeCompression, function (poolId) {
                    promises.push(checkAnyPoolWhichAllPgsCompressionEnabled(poolId));
                });

                $q.all(promises).then(function () {
                    if (!hasAnyPoolWhichHasAllOfPgsCompressionSupported) {
                        createVolumes(storageSystemId, volumes, vsm);
                    } else {
                        warnUnmatchedCompressTechs(storageSystemId, volumes, vsm);
                    }
                });
            }
        };
    });
