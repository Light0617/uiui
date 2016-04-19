'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:SharesExportsCtrl
 * @description
 * # SharesExportsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('SharesExportsCtrl', function ($scope, $routeParams, $timeout, $filter, orchestratorService,
                                                          objectTransformService, synchronousTranslateService, scrollDataSourceBuilderService, $location,
                                                linkLabelService) {
        var storageSystemId = $routeParams.storageSystemId;
        var shares;
        var evses;
        var fileSystems;

        function transformService(sharesExports) {
            var dataModel = {
                file: true,
                title: synchronousTranslateService.translate('common-storage-system-shares-exports'),
                storageSystemId: storageSystemId,
                allEvsPage: true,
                view: 'tile',
                evsIds: _.map(_.uniq(_.map(sharesExports, function (shareExport) {
                    return _.find(evses, function(input) {
                        return input.uuid === shareExport.evsUuid;
                    });
                })), function (item) {
                    return { 'label' : item.name };
                }),
                allItemsSelected: false,
                search: {
                    freeText: '',
                    type: null,
                    filterEvs: ''
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
            sharesExports = linkLabelService.replaceEVSUuidWithLabel(sharesExports, evses);
            sharesExports = linkLabelService.replaceFSIdWithLabel(sharesExports, fileSystems);
            var actions = [
                {
                    icon: 'icon-delete',
                    tooltip: 'action-tooltip-delete',
                    type: 'confirm',
                    confirmTitle: 'shares-exports-delete-confirmation',
                    confirmMessage: 'shares-exports-delete-selected-content',
                    enabled: function () {
                        return $scope.dataModel.anySelected();
                    },
                    onClick: function () {
                        _.forEach($scope.dataModel.getSelectedItems(), function (item) {
                            if (item.type === 'Share') {
                                orchestratorService.deleteShare(storageSystemId, item.fileSystemId, item.id);
                            }
                            else {
                                orchestratorService.deleteExport(storageSystemId, item.fileSystemId, item.id);
                            }
                        });
                    }
                },
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return $scope.dataModel.onlyOneSelected();
                    },
                    onClick: function () {
                        var item = _.first($scope.dataModel.getSelectedItems());
                        $location.path(['storage-systems', storageSystemId, 'file-systems', item.fileSystemId,
                            item.urlType, item.id, 'update'].join('/'));
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

            dataModel.gridSettings = [
                {
                    title: 'Name',
                    sizeClass: 'twelfth',
                    sortField: 'name',
                    getDisplayValue: function (item) {
                        return item.name;
                    }

                },
                {
                    title: 'Type',
                    sizeClass: 'twelfth',
                    sortField: 'type',
                    getDisplayValue: function (item) {
                        return item.type;
                    }
                },
                {
                    title: 'Path',
                    sizeClass: 'quarter',
                    sortField: 'fileSystemPath',
                    getDisplayValue: function (item) {
                        return item.fileSystemPath;
                    }
                }
            ];

            dataModel.addAction = function () {
                $location.path(['storage-systems', storageSystemId, 'shares-exports', 'add'].join('/'));
            };

            $scope.dataModel = dataModel;
            scrollDataSourceBuilderService.setupDataLoader($scope, sharesExports, 'sharesExportsSearch');
        }

        orchestratorService.enterpriseVirtualServers(storageSystemId).then(function(result) {
            evses = result.evses;
        });

        orchestratorService.allShares(storageSystemId).then(function (result) {
            shares = result.shares;
            return orchestratorService.allExports(storageSystemId);
        }, function() {transformService([]);}).then(function (result) {
            var sharesExports = shares.concat(result.exports);
            orchestratorService.fileSystems(storageSystemId).then(function (fs) {
                fileSystems = fs.fileSystems;
                transformService(sharesExports);
            });


        }, function() {transformService([]);});



    });
