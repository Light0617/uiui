'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ExternalVolumeCtrl
 * @description
 * # ExternalVolumeCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ExternalVolumeCtrl', function ($scope, $routeParams, $timeout, $window, $location, orchestratorService,
                                                synchronousTranslateService, objectTransformService, ShareDataService,
                                                paginationService, resourceTrackerService, migrationTaskService,
                                                constantService) {
        var storageSystemId = $routeParams.storageSystemId;
        var volumeId = $routeParams.volumeId;
        $scope.volumeId = objectTransformService.transformVolumeId(volumeId);
        $scope.noDataVisualization = false;

        orchestratorService.externalVolume(storageSystemId, volumeId).then(function (result) {

            var summaryModel = objectTransformService.transformToExternalVolumeSummaryModel(result);
            summaryModel.title = 'Storage volume ' + objectTransformService.transformVolumeId(volumeId);

            $scope.summaryModel = summaryModel;
            result.orchestratorService = orchestratorService;
            $scope.model = result;
            $scope.model.dialogSettings = {
                id: 'securityEnableDisableConfirmation',
                dialogTitle: 'external-volumes-unvirtualize-confirmation',
                content: 'external-volumes-unvirtualize-content',
                trueText: 'external-volumes-unvirtualize-remove-zone',
                falseText: 'external-volumes-unvirtualize-keep-zone-intact',
                switchEnabled: {
                    value: false
                },
                disableRadioButton: result.provisioningStatus === 'UNATTACHED'

            };

            if (result.poolId !== null && result.poolId !== undefined) {
                orchestratorService.storagePool(storageSystemId, result.poolId).then(function (result) {
                    result.displayType = synchronousTranslateService.translate(result.type);
                    $scope.model.storagePool = result;
                });
            }

            $scope.unvirtualize = function () {
                var enabled = $scope.model.dialogSettings.switchEnabled.value;
                var unvirtualizePayload = {
                    storageSystemId: storageSystemId,
                    volumeIds: [volumeId],
                    cleanupZones: enabled
                };

                // This code comes from external-volumes.js.
                orchestratorService.unvirtualizeVolume(unvirtualizePayload);
            };

            $scope.isUnvirtualizeAvailable = function () {
                return !$scope.model.isMigrating() && $scope.model.provisioningStatus !== 'UNMANAGED' &&
                    $scope.model.status !== 'BLOCKED';
            };

            $scope.migrateVolume = function () {
                ShareDataService.selectedMigrateVolumes = [$scope.model];
                $location.path(['storage-systems', $scope.model.storageSystemId, 'migrate-volumes'].join('/'));
            };

            $scope.isMigrateAvailable = function () {
                return migrationTaskService.isMigrationAvailable($scope.model);
            };

            $scope.valueOrNA = function (value) {
                return value ? value : constantService.notAvailable;
            };

            return orchestratorService.storageExternalParityGroup(storageSystemId, result.externalParityGroupId);
        }).then(function (externalParityGroup) {
            objectTransformService.mergeExtParityGroupToExternalVolume($scope.model, externalParityGroup);
        });

        // TODO CopyPair informations. It is required API for externalVolumes.

    });
