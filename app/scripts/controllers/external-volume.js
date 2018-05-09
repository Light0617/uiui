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

            if (result.poolId !== null && result.poolId !== undefined) {
                orchestratorService.storagePool(storageSystemId, result.poolId).then(function (result) {
                    result.displayType = synchronousTranslateService.translate(result.type);
                    $scope.model.storagePool = result;
                });
            }

            migrationTaskService.checkLicense(storageSystemId).then(function (result) {
                $scope.volumeMigrationAvailable = result;
            });

            $scope.unvirtualize = function () {
                var unvirtualizePayload = {
                    storageSystemId: storageSystemId,
                    volumeIds: [volumeId]
                };

                // This code comes from external-volumes.js.
                orchestratorService.unvirtualizeVolume(unvirtualizePayload);
            };

            $scope.isUnvirtualizeAvailable = function () {
                return !$scope.model.isMigrating() && $scope.model.provisioningStatus !== 'UNMANAGED';
            };

            $scope.migrateVolume = function () {
                ShareDataService.selectedMigrateVolumes = [$scope.model];
                $location.path(['storage-systems', $scope.model.storageSystemId, 'migrate-volumes'].join('/'));
            };

            $scope.isMigrateAvailable = function () {
                return $scope.volumeMigrationAvailable && migrationTaskService.isMigrationAvailable($scope.model);
            };

            $scope.valueOrNA = function (value) {
                return value ? value : constantService.notAvailable;
            };
        });

        // TODO CopyPair informations. It is required API for externalVolumes.

    });
