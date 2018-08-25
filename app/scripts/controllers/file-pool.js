'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:FilePoolCtrl
 * @description
 * # FilePoolCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FilePoolCtrl', function ($scope, $routeParams, $timeout, $filter, diskSizeService, fileSystemService,
                                          orchestratorService, objectTransformService, synchronousTranslateService,
                                          scrollDataSourceBuilderService, $location, linkLabelService, constantService) {
        var storageSystemId = $routeParams.storageSystemId;
        var filePoolId = $routeParams.filePoolId;
        var result;
        var fileSystems;
        var evses;
        orchestratorService.enterpriseVirtualServers(storageSystemId).then(function (result) {
            evses = result.evses;
            return orchestratorService.filePool(storageSystemId, filePoolId);
        }).then(function (fp) {
            fp.bottomLegend = true;
            result = fp;
            return orchestratorService.filePoolFileSystems(storageSystemId, filePoolId);
        }).then(function (fs) {
            fileSystems = fs.fileSystems;
            fileSystems = linkLabelService.replaceEVSUuidWithLabel(fileSystems, evses);
            fileSystems = linkLabelService.replacePoolIdWithLabel(fileSystems, [result]);
            var summaryModel = {};
            summaryModel.title = synchronousTranslateService.translate('common-storage-systems');
            summaryModel.noBreakdown = true;

            $scope.summaryModel = summaryModel;

            result.orchestratorService = orchestratorService;

            var fileServer = [];
            _.forEach(fileSystems, function (fileSystem) {
                if (!_.find(fileServer, function(fs) { return fs.id === fileSystem.evsId; })) {
                    var evs = _.first(_.where(evses, {id: fileSystem.evsId}));
                    if (evs) {
                        fileServer.push(evs);
                    }
                }
            });

            var dataModel = {
                file: true,
                title: synchronousTranslateService.translate('file-pool') + ' ' + result.label,
                titleTooltip: synchronousTranslateService.translate('file-pools-tooltip'),
                storageSystemId: storageSystemId,
                view: 'tile',
                allItemsSelected: false,
                showRelatedResourcesHeader: true,
                filePool: result,
                numOfFileSystems: fileSystems.length,
                search: {
                    freeText: '',
                    freeCapacity: constantService.CAPACITY_FILTER_DEFAULT_CONDITION(),
                    totalCapacity: constantService.CAPACITY_FILTER_DEFAULT_CONDITION(),
                    fileServer: null
                },
                actionTitle: synchronousTranslateService.translate('file-systems-add'),
                fileServer: fileServer,
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
                    confirmTitle: 'file-pool-delete-confirmation',
                    confirmMessage: 'file-pool-detail-delete-confirmation',
                    enabled: function () {
                        return true;
                    },
                    onClick: function () {
                        orchestratorService.deleteFilePool(storageSystemId, filePoolId);
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
                        $location.path(['storage-systems', storageSystemId, 'file-pools', filePoolId, 'expand'].join('/'));
                    }
                }
            ];

            summaryModel.getActions = function () {
                return summaryModelActions;
            };

            dataModel.addAction = function () {
                $location.path(['storage-systems', storageSystemId, 'file-pools', filePoolId, 'file-systems', 'add'].join('/'));
            };

            objectTransformService.transformFilePoolSummaryModel(dataModel.filePool);

            dataModel.filePool.barData = [
                {
                    colorClass: 'file-used',
                    legendText: dataModel.filePool.usedLegend,
                    capacity: dataModel.filePool.usedCapacityInBytes
                },
                {
                    colorClass: 'file-allocated',
                    legendText: dataModel.filePool.allocatedLegend,
                    capacity: dataModel.filePool.physicalCapacityInBytes
                },
                {
                    colorClass: 'file-overcommited',
                    legendText: dataModel.filePool.overCommitLegend,
                    capacity: dataModel.filePool.capacityInBytes
                }
            ];

            $scope.dataModel = dataModel;
            scrollDataSourceBuilderService.setupDataLoader($scope, fileSystems, 'fileSystemsSearch');
            setDataModelActions();
            $scope.summaryModel = summaryModel;
        });

        function setDataModelActions(){
            var dataModel = $scope.dataModel;
            var actions = [
                {
                    icon: 'icon-delete',
                    tooltip :'action-tooltip-delete',
                    type: 'confirm',
                    confirmTitle: 'file-system-delete-confirmation',
                    confirmMessage: 'file-system-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    onClick: function () {
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            orchestratorService.deleteFileSystem(storageSystemId, item.id);
                        });
                    }
                },
                {
                    icon: 'icon-edit',
                    tooltip: 'action-tooltip-edit',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected();
                    },
                    onClick: function () {
                        if (dataModel.onlyOneSelected()) {
                            $location.path(['storage-systems', storageSystemId, 'file-systems',
                                _.first(dataModel.getSelectedItems()).id, 'update'
                            ].join('/'));
                        }
                    }
                },
                {
                    icon: 'icon-unmount',
                    tooltip :'action-tooltip-unmount',
                    type: 'confirm',
                    confirmTitle: 'file-system-unmount-confirmation',
                    confirmMessage: 'file-system-unmount-selected-content',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && _.first(dataModel.getSelectedItems()).status !== 'Not Mounted';
                    },
                    onClick: function () {
                        if (dataModel.onlyOneSelected() && _.first(dataModel.getSelectedItems()).status !== 'Not Mounted') {
                            var payload = {'status': 'unmount'};
                            orchestratorService.patchFileSystem(storageSystemId, _.first(dataModel.getSelectedItems()).id, payload);
                        }
                    }
                },
                {
                    icon: 'icon-mount',
                    tooltip: 'action-tooltip-mount',
                    type: 'confirmation-modal',
                    dialogSettings: {
                        id: 'detachVolumeConfirmation',
                        dialogTitle: 'file-system-mount-confirmation',
                        content: 'file-system-mount-selected-content',
                        trueText: 'file-systems-virtual-machine',
                        falseText: 'file-systems-database',
                        switchEnabled: {
                            value: false
                        },
                        requireSelection: true
                    },
                    enabled: function () {
                        if(dataModel.onlyOneSelected() && _.first(dataModel.getSelectedItems()).status !== 'Mounted') {
                            if (_.first(dataModel.getSelectedItems()).blockSize === 0) {
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
                        if (this.dialogSettings.switchEnabled.value) {
                            blockSize = 4;
                        }
                        if (_.first(dataModel.getSelectedItems()).blockSize === 0) {
                            payload = {'status': 'mount', 'blockSize': blockSize};
                        }
                        else {
                            payload = {'status': 'mount'};
                        }
                        orchestratorService.patchFileSystem(storageSystemId, _.first(dataModel.getSelectedItems()).id, payload);
                    }
                }
            ];

            $scope.dataModel.getActions = function () {
                return actions;
            };
        }



    });
