'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('DashboardCtrl', function ($scope, orchestratorService, objectTransformService, paginationService) {
        var dataProtection;
        var unified;
        var GET_STORAGE_SYSTEM_PATH = 'storage-systems';
        var GET_FABRICS_PATH = 'san-fabrics';
        var tiers;
        var storageSystemsInCacheCount = 0;

        function transformService(fileSummary) {
            orchestratorService.tiers().then(function (result) {
                tiers = result;
                return orchestratorService.storageSystemsSummary();
            }).then(function (result) {
                $scope.dataModel = {
                    fabricsCount: 0,
                    evsCount: 0
                };
                if (fileSummary) {
                    result.unified = true;
                    $scope.dataModel.evsCount = 0;
                    $scope.dataModel.unified = true;
                    orchestratorService.allEnterpriseVirtualServers().then(function (result) {
                        $scope.dataModel.evsCount = result.evses.length;
                    });
                }
                var model = objectTransformService.transformToStorageSummaryModel(result, fileSummary, dataProtection);
                objectTransformService.transformTierSummary(tiers, result.tierSummaryItems, model);

                $scope.model = model;
                $scope.model.summary.storageSystemsInCacheCount = storageSystemsInCacheCount;
                orchestratorService.hostsSummary().then(function (result) {
                    $scope.model.summary.hostsCount = result.totalHost;
                });

                paginationService.get(null, GET_FABRICS_PATH, objectTransformService.transformFabricSwitch, true).then(function (result) {
                    $scope.dataModel.fabricsCount = result.total;
                });
            });
        }

        paginationService.getAllPromises(null, GET_STORAGE_SYSTEM_PATH, true, null, objectTransformService.transformStorageSystem).then(function (result) {
            unified = _.find(result, function (storageSystem) { return storageSystem.unified && storageSystem.accessible; });
            storageSystemsInCacheCount = result.length;
            return orchestratorService.dataProtectionSummary();
        }).then(function (result) {
            dataProtection = result;
            if (unified) {
                orchestratorService.filePoolsSummary().then(function (result) {
                    transformService(result);
                }, function() {transformService(false);});
            }
            else {
                transformService(false);
            }
        });
    });