'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:FileSystemCtrl
 * @description
 * # FileSystemCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FileSystemCtrl', function ($scope, $routeParams, $timeout, $filter, diskSizeService, fileSystemService,
                                            orchestratorService, objectTransformService, synchronousTranslateService, scrollDataSourceBuilderService, $location) {
        var storageSystemId = $routeParams.storageSystemId;
        var fileSystemId = $routeParams.fileSystemId;
        var filePool;
        var exports;
        var shares;
        var fileSystem;
        var evs;

        orchestratorService.exports(storageSystemId, fileSystemId).then(function (result) {
            exports = result.exports;
            return orchestratorService.shares(storageSystemId, fileSystemId);
        }).then(function (result) {
                shares = result.shares;
                return orchestratorService.fileSystem(storageSystemId, fileSystemId);
        }).then(function (result) {
                    result.bottomLegend = true;
                    fileSystem = result;
                    return orchestratorService.filePool(storageSystemId, result.filePoolId);
        }).then(function (fp) {
                filePool = fp;
                return orchestratorService.enterpriseVirtualServers(storageSystemId);
        }).then(function (virtualFileServers) {
                evs = _.find(virtualFileServers.evses, function(fileServer) { return fileServer.id === fileSystem.evsId; });
                var summaryModel = {};
                var shareLength = 0;
                var exportLength = 0;
                summaryModel.title = synchronousTranslateService.translate('common-storage-systems');
                summaryModel.noBreakdown = true;
                summaryModel.filePoolOnClick = function () {
                    $location.path(['storage-systems', storageSystemId, 'file-pools', filePool.id].join('/'));
                };
                $scope.summaryModel = summaryModel;
                if(shares) {
                    shareLength = shares.length;
                }
                else {
                    shares = [];
                }
                if(exports) {
                    exportLength = exports.length;
                }
                else {
                    exports = [];
                }
                var dataModel = {
                    file: true,
                    title: synchronousTranslateService.translate('common-storage-system-file-system') + ' ' + fileSystem.label,
                    storageSystemId: storageSystemId,
                    view: 'tile',
                    allItemsSelected: false,
                    showRelatedResourcesHeader: true,
                    windows: shareLength,
                    linux: exportLength,
                    search: {
                        type: null
                    },
                    fileSystem: fileSystem,
                    filePool: filePool,
                    format: fileSystem.blockSizeDisplay,
                    expansionLimit: fileSystem.expansionLimitInBytes,
                    actionTitle: synchronousTranslateService.translate('shares-exports-add'),
                    fileServer: evs,
                    fileServerIp: _.first(evs.interfaceAddresses).ip,
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
                        tooltip :'action-tooltip-delete',
                        type: 'confirm',
                        confirmTitle: 'file-system-delete-confirmation',
                        confirmMessage: 'file-system-delete-selected-content',
                        enabled: function () {
                            return true;
                        },
                        onClick: function () {
                            orchestratorService.deleteFileSystem(storageSystemId, fileSystemId);
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
                            $location.path(['storage-systems', storageSystemId, 'file-systems',
                                fileSystemId, 'update'
                            ].join('/'));
                        }
                    },
                    {
                        icon: 'icon-unmount',
                        tooltip: 'action-tooltip-unmount',
                        type: 'confirm',
                        confirmTitle: 'file-system-unmount-confirmation',
                        confirmMessage: 'file-system-unmount-selected-content',
                        enabled: function () {
                            return $scope.dataModel.fileSystem.status === 'Mounted';
                        },
                        onClick: function () {
                            var payload = {'status': 'unmount'};
                            orchestratorService.patchFileSystem(storageSystemId, fileSystemId, payload);
                        }
                    },
                    {
                        icon: 'icon-mount',
                        tooltip: 'action-tooltip-mount',
                        type: 'confirmation-modal',
                        dialogSettings: {
                            id: 'detachVolumeConfirmation',
                            title: 'file-system-mount-confirmation',
                            content: 'file-system-mount-selected-content',
                            trueText: 'file-systems-virtual-machine',
                            falseText: 'file-systems-database',
                            switchEnabled: false,
                            requireSelection: true
                        },
                        enabled: function () {
                            if($scope.dataModel.fileSystem.status === 'Not Mounted') {
                                if ($scope.dataModel.fileSystem.blockSize === 0) {
                                    $('#selection').show();
                                    $('#selectionMessage').text(synchronousTranslateService.translate('file-system-mount-selected-content'));
                                }
                                else {
                                    $('#selection').hide();
                                    $('#selectionMessage').text(synchronousTranslateService.translate('file-system-mount-content'));
                                }
                                return true;
                            }
                            return false;
                        },
                        confirmClick: function () {
                            var blockSize = 32;
                            var payload;
                            if (this.dialogSettings.switchEnabled) {
                                blockSize = 4;
                            }
                            if ($scope.dataModel.fileSystem.blockSize === 0) {
                                payload = {'status': 'mount', 'blockSize': blockSize};
                            }
                            else {
                                payload = {'status': 'mount'};
                            }
                            orchestratorService.patchFileSystem(storageSystemId, fileSystemId, payload);
                        }
                    }
                ];

                summaryModel.getActions = function () {
                    return summaryModelActions;
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
                    $location.path(['storage-systems', storageSystemId, 'file-systems', fileSystemId, 'shares-exports', 'add'].join('/'));
                };

                $scope.dataModel = dataModel;
                $scope.summaryModel = summaryModel;
                scrollDataSourceBuilderService.setupDataLoader($scope, shares.concat(exports), 'fileSystemSearch');
                setDataModelActions();
            });

        function setDataModelActions(){
            var actions = [
                {
                    icon: 'icon-delete',
                    tooltip :'action-tooltip-delete',
                    type: 'confirm',
                    confirmTitle: 'shares-exports-delete-confirmation',
                    confirmMessage: 'shares-exports-delete-selected-content',
                    enabled: function () {
                        return $scope.dataModel.anySelected();
                    },
                    onClick: function () {
                        _.forEach($scope.dataModel.getSelectedItems(), function (item) {
                            if(item.type === 'Share') {
                                orchestratorService.deleteShare(storageSystemId, fileSystemId, item.id);
                            }
                            else{
                                orchestratorService.deleteExport(storageSystemId, fileSystemId, item.id);
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
                        if ($scope.dataModel.onlyOneSelected()) {
                            var item = _.first($scope.dataModel.getSelectedItems());
                            $location.path(['storage-systems', storageSystemId, 'file-systems', item.fileSystemId,
                                item.urlType, item.id, 'update'].join('/'));
                        }
                    }
                },
            ];

            $scope.dataModel.getActions = function () {
                return actions;
            };
        }



    });
