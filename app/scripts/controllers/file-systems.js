'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:FileSystemsCtrl
 * @description
 * # FileSystemsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FileSystemsCtrl', function ($scope, $routeParams, $timeout, $filter, orchestratorService, objectTransformService, synchronousTranslateService,
                                             scrollDataSourceBuilderService, $location, linkLabelService) {
        var storageSystemId = $routeParams.storageSystemId;
        var evses;
        var filePools;


        orchestratorService.enterpriseVirtualServers(storageSystemId).then(function (result) {
            evses = result.evses;
            return orchestratorService.fileSystems(storageSystemId);
        }).then(function (result) {
            var fileSystems = result.fileSystems;

            orchestratorService.filePools(storageSystemId).then(function (fps) {
                filePools = fps.filePools;


                var fileServer = [];
                var pools = [];
                _.forEach(fileSystems, function (fileSystem) {
                    if (!_.find(fileServer, function (fs) {
                            return fs.id === fileSystem.evsId;
                        })) {
                        var evs = _.first(_.where(evses, {id: fileSystem.evsId}));
                        if (evs) {
                            fileServer.push(evs);
                        }
                    }

                    if (!_.find(pools, function (fp) {
                            return fp.id === fileSystem.filePoolId;
                        })) {
                        var pool = _.first(_.where(filePools, {id: fileSystem.filePoolId}));
                        if (pool) {
                            pools.push(pool);
                        }
                    }
                    
                });
                fileSystems = linkLabelService.replaceEVSUuidWithLabel(fileSystems, evses);
                fileSystems = linkLabelService.replacePoolIdWithLabel(fileSystems, pools);
                var dataModel = {
                    file: true,
                    title: synchronousTranslateService.translate('common-storage-system-file-systems'),
                    storageSystemId: storageSystemId,
                    view: 'tile',
                    allItemsSelected: false,
                    search: {
                        freeText: '',
                        freeCapacity: {
                            min: 0,
                            max: 1000,
                            unit: 'PB'
                        },
                        totalCapacity: {
                            min: 0,
                            max: 1000,
                            unit: 'PB'
                        },
                        fileServer: null
                    },
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
                var actions = [
                    {
                        icon: 'icon-delete',
                        tooltip: 'action-tooltip-delete',
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
                            $location.path(['storage-systems', storageSystemId, 'file-systems',
                                _.first(dataModel.getSelectedItems()).id, 'update'
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
                            return dataModel.onlyOneSelected() && _.first(dataModel.getSelectedItems()).status !== 'Not Mounted';
                        },
                        onClick: function () {
                            var payload = {'status': 'unmount'};
                            orchestratorService.patchFileSystem(storageSystemId, _.first(dataModel.getSelectedItems()).id, payload);
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
                            switchEnabled: {
                                value: false
                            },
                            requireSelection: true
                        },
                        enabled: function () {
                            if (dataModel.onlyOneSelected() && _.first(dataModel.getSelectedItems()).status !== 'Mounted') {
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

                dataModel.getActions = function () {
                    return actions;
                };

                dataModel.gridSettings = [
                    {
                        title: 'Name',
                        sizeClass: 'sixth',
                        sortField: 'label',
                        getDisplayValue: function (item) {
                            return item.label;
                        }

                    },
                    {
                        title: 'Status',
                        sizeClass: 'sixth',
                        sortField: 'status',
                        getDisplayValue: function (item) {
                            return item.status;
                        }

                    },
                    {
                        title: 'file-pool-total',
                        sizeClass: 'twelfth',

                        sortField: 'capacityInBytes.value',
                        getDisplayValue: function (item) {
                            return item.capacityInBytes;
                        },
                        type: 'size'

                    },
                    {
                        title: 'file-pool-free',
                        sizeClass: 'twelfth',
                        sortField: 'availableCapacityInBytes.value',
                        getDisplayValue: function (item) {
                            return item.availableCapacityInBytes;
                        },
                        type: 'size'

                    },
                    {
                        title: 'common-file-used',
                        sizeClass: 'twelfth',
                        sortField: 'usedCapacityInBytes.value',
                        getDisplayValue: function (item) {
                            return item.usedCapacityInBytes;
                        },
                        type: 'size'
                    }
                ];


                dataModel.addAction = function () {
                    $location.path(['storage-systems', storageSystemId, 'file-systems', 'add'].join('/'));
                };

                $scope.dataModel = dataModel;
                scrollDataSourceBuilderService.setupDataLoader($scope, fileSystems, 'fileSystemsSearch');

            });
        });

    });
