'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumesAddCtrl
 * @description
 * # StorageSystemVolumesAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemVolumesAddCtrl', function ($scope, $routeParams, $timeout, $window, $filter,
                                                         orchestratorService, diskSizeService, viewModelService,
                                                         volumeService, synchronousTranslateService, paginationService,
                                                         objectTransformService, ShareDataService, resourceTrackerService) {
        var storageSystemId = $routeParams.storageSystemId;
        var GET_STORAGE_SYSTEMS_PATH = 'storage-systems';
        var autoSelectedPoolId = ShareDataService.pop('autoSelectedPoolId');

        paginationService.getAllPromises(null, GET_STORAGE_SYSTEMS_PATH, true, null,
            objectTransformService.transformStorageSystem).then(function (result) {
            var storageSystems = result;
            var selectable = _.isUndefined(storageSystemId);

            var storageSystem = _.find(storageSystems, function (s) {
                return selectable || s.storageSystemId === storageSystemId;
            });

            var dataModel = {
                storageSystems: storageSystems,
                selectedStorageSystem: storageSystem,
                storageSystemSelectable: selectable,
                autoSelectedPoolId: autoSelectedPoolId
            };

            $scope.dataModel = dataModel;
        });

        $scope.$watch('dataModel.selectedStorageSystem', function (selectedStorageSystem) {
            if (!selectedStorageSystem) {
                return;
            }

            paginationService.getAllPromises(null, 'storage-pools', true, selectedStorageSystem.storageSystemId, objectTransformService.transformPool)
                .then (function (result) {
                var filteredPools = _.filter(result, function(pool) {
                    return pool.type !== synchronousTranslateService.translate('HTI') && !pool.ddmEnabled;
                });
                $scope.dataModel.storagePools = filteredPools;
                if(autoSelectedPoolId!==undefined) {
                    $scope.dataModel.storagePools = _.filter(filteredPools, function(pool) {
                        return pool.type !== synchronousTranslateService.translate('HTI') && pool.storagePoolId.toString() === autoSelectedPoolId;
                    });
                }
            });

            $scope.dataModel.summaryModel = viewModelService.buildSummaryModel(selectedStorageSystem);
        });

        $scope.$watch('dataModel.storagePools', function (pools) {
            if (!pools) {
                return;
            }
            var volumesGroupsModel = viewModelService.newCreateVolumeModel(pools);
            var createModel = {
                storageSystemSelectable: false,
                simpleNameRegexp: /^[a-zA-Z0-9_][a-zA-Z0-9-_]*$/,
                volumesGroupsModel: volumesGroupsModel,
                canSubmit: function () {
                    return $scope.dataModel.createModel.volumesGroupsModel.isValid();
                },
                submit: function () {
                    var volumes = volumesGroupsModel.mapToPayloads(volumesGroupsModel.getVolumeGroups(), autoSelectedPoolId);
                    var payload = {
                        storageSystemId: storageSystemId,
                        volumes: volumes
                    };

                    // Build reserved resources
                    var reservedResourcesList = [];
                    _.forEach(volumes, function (vol) {
                        if(vol.poolId !== null) {
                            reservedResourcesList.push(vol.poolId + '=' + resourceTrackerService.storagePool());
                        }
                    });

                    // Show popup if resource is present in resource tracker else submit
                    resourceTrackerService.showReservedPopUpOrSubmit(reservedResourcesList, storageSystemId, resourceTrackerService.storageSystem(),
                        'Create Volumes Confirmation', null, null, payload, orchestratorService.createVolumes);
                }

            };

            $scope.dataModel.createModel = createModel;
            $scope.dataModel.validLabel = function(volumeGroup) {
                volumeGroup.labelIsValid = volumeService.validateCombinedLabel(volumeGroup.label, volumeGroup.suffix, volumeGroup.noOfVolumes);
            };

        });

        var subscriptionUpdateModel = viewModelService.newSubscriptionUpdateModel();

        $scope.$watch('dataModel.createModel.volumesGroupsModel.volumes', function (volumeGroups) {

            var arrayCopy = subscriptionUpdateModel.getUpdatedModel($scope.dataModel.selectedStorageSystem, volumeGroups);
            if (!arrayCopy) {
                return;
            }
            $timeout(function () {
                $scope.dataModel.summaryModel = viewModelService.buildSummaryModel(arrayCopy);
            });


        }, true);

    });
