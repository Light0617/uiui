'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ShareCtrl
 * @description
 * # ShareCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('ShareCtrl', function ($scope, $routeParams, $timeout, $filter, diskSizeService, fileSystemService,
                                            orchestratorService, objectTransformService, synchronousTranslateService, scrollDataSourceBuilderService, $location,
    linkLabelService) {
        var storageSystemId = $routeParams.storageSystemId;
        var fileSystemId = $routeParams.fileSystemId;
        var shareId = $routeParams.shareId;
        var share;
        var fileSystem;

        function transformService() {
            orchestratorService.enterpriseVirtualServer(storageSystemId, share.evsUuid).then(function (evs) {
            var summaryModel = {};

                var shareList = [];
                shareList.push(share);
                share = linkLabelService.replaceFSIdWithLabel(shareList, fileSystem);
                share = linkLabelService.replaceEVSUuidWithLabel(share, evs);
                if( Array.isArray(share) ){
                    share = share[0];
                }

            var dataModel = {
                file: true,
                title: synchronousTranslateService.translate('share') + ' ' + share.name,
                storageSystemId: storageSystemId,
                view: 'tile',
                allItemsSelected: false,
                share: share,
                onlyOperation: true,
                evsIp: _.first(evs.interfaceAddresses).ip,
                userGroups: share.permissions.length,
                search: {
                    permission: null
                },
                sort: {
                    field: 'usageBare',
                    reverse: true,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            }
                            else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                }
            };

            var summaryModelActions = [
                {
                    icon: 'icon-delete',
                    tooltip: 'action-tooltip-delete',
                    type: 'confirm',
                    confirmTitle: 'share-delete-confirmation',
                    confirmMessage: 'share-delete-selected-content',
                    enabled: function () {
                        return true;
                    },
                    onClick: function () {
                        orchestratorService.deleteShare(storageSystemId, fileSystemId, shareId);
                    }
                },
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return true;
                    },
                    onClick: function () {
                        $location.path(['storage-systems', storageSystemId, 'file-systems', fileSystemId, 'shares', shareId, 'update'].join('/'));
                    }
                }
            ];

            summaryModel.getActions = function () {
                return summaryModelActions;
            };

            dataModel.addAction = function () {
                $location.path(['storage-systems', storageSystemId, 'file-systems', fileSystemId, 'shares', shareId,'groups', 'add'].join('/'));
            };

            dataModel.gridSettings = [
                {
                    title: 'Group Name',
                    sizeClass: 'sixth',
                    sortField: 'groupName',
                    getDisplayValue: function (item) {
                        return item.groupName;
                    },
                    type: 'id'

                },
                {
                    title: 'Permission Type',
                    sizeClass: 'quarter',
                    sortField: 'permissionDisplay',
                    getDisplayValue: function (item) {
                        return item.permissionDisplay;
                    }

                }
            ];

            $scope.dataModel = dataModel;
            $scope.summaryModel = summaryModel;

            $scope.dataModel.permissions = _.uniq(_.map(share.permissions, function(permission){ return _.first(permission.metaData).detailsNoSlash[1]; }));
            scrollDataSourceBuilderService.setupDataLoader($scope, share.permissions, 'permissionsSearch');

        });
        }

        orchestratorService.share(storageSystemId, fileSystemId, shareId).then(function (result) {
            share = result;
                orchestratorService.fileSystem(storageSystemId, share.fileSystemId).then(function (fs) {
                    fileSystem = fs;
                    transformService();
                });
        }, function() {
                orchestratorService.allShares(storageSystemId).then(function (result) {
                share = _.find(result.shares, function (share) {
                    return share.fileSystemId === fileSystemId && share.id === shareId;
                });
                transformService();
            });
        }
        );
    });
