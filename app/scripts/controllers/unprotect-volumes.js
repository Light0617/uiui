'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:UnprotectVolumesCtrl
 * @description
 * # UnprotectVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('UnprotectVolumesCtrl', function ($scope, orchestratorService, objectTransformService,
                                                  scrollDataSourceBuilderService, $routeParams, $q, $timeout,
                                                  ShareDataService, synchronousTranslateService, paginationService,
                                                  storageSystemVolumeService, queryService) {
        var volume = _.first(ShareDataService.volumeListForUnprotect);
        if (!volume) {
            window.history.back();
        }

        var storageSystemId = $routeParams.storageSystemId ? $routeParams.storageSystemId : volume.storageSystemId;
        $scope.title = synchronousTranslateService.translate('unprotect-volume') + ' ' + volume.volumeId;

        paginationService.clearQuery();
        queryService.setQueryMapEntry('primaryVolumeIds', parseInt(volume.volumeId));
        paginationService.get(null, storageSystemVolumeService.REPLICATION_GROUPS_PATH,
            objectTransformService.transformReplicationGroup, false, storageSystemId).then(function(result){
            var replicationGroups = _.forEach(_.filter (result.resources, function (rg) {
                return !rg.hasOwnProperty('isExternal');
            }), function (replicationGroup) {
                replicationGroup.selected = false;
            });

            $scope.dataModel = {
                replicationGroups: replicationGroups,
                deleteSecondaryVolume: true,
                enableSubmitButton: false,
                view: 'list',
                sort: {
                    field: 'name',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            } else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                }
            };
            scrollDataSourceBuilderService.setupDataLoader($scope, $scope.dataModel.replicationGroups);
        });

        $scope.canSubmit = function () {
            $scope.dataModel.enableSubmitButton = _.find($scope.dataModel.displayList,
                function (rg) {return rg.selected;}) === undefined ? false : true;
        };

        $scope.submitActions = function () {
            var tasks = [];
            var payload = {
                primaryVolumeIds: [volume.volumeId],
                deleteSecondaryVolume: $scope.dataModel.deleteSecondaryVolume
            };

            _.forEach($scope.dataModel.displayList, function (rg) {
                if (rg.selected) {
                    tasks.push(orchestratorService.unprotectReplicationGroup(storageSystemId, rg.id, payload));
                }
            });
            $q.all(tasks).then(function () {
                window.history.back();
            });
        };
    });
