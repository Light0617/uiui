'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:EnterpriseVirtualServerCtrl
 * @description
 * # EnterpriseVirtualServerCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('EnterpriseVirtualServerCtrl', function ($scope, $routeParams, $timeout, $filter, diskSizeService, fileSystemService,
                                            orchestratorService, objectTransformService, synchronousTranslateService, scrollDataSourceBuilderService, $location) {
        var storageSystemId = $routeParams.storageSystemId;
        var evsId = $routeParams.evsId;
        var result;
        var fileSystems;

        orchestratorService.enterpriseVirtualServer(storageSystemId, evsId).then(function (evs) {
            result = evs;
            return orchestratorService.evsFileSystems(storageSystemId, evsId);
        }).then(function (fs) {
            fileSystems = fs.fileSystems;
            var summaryModel = {};
            summaryModel.storageSystemOnClick = function(){
                $location.path(['storage-systems', storageSystemId].join('/'));
            };
            $scope.summaryModel = summaryModel;

            var fileServer = [];

            _.forEach(fileSystems, function (fileSystem) {
                if (fileServer.indexOf(fileSystem.evsId) < 0) {
                    fileServer.push(fileSystem.evsId);
                }
            });

            var dataModel = {
                file: true,
                title: synchronousTranslateService.translate('virtual-file-server') + ' ' + result.name,
                titleTooltip: synchronousTranslateService.translate('evs-tooltip'),
                evsPage: true,
                storageSystemId: storageSystemId,
                view: 'tile',
                allItemsSelected: false,
                evs: result,
                numOfFileSystems: fileSystems.length,
                showRelatedResourcesHeader: true,
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
                actionTitle: synchronousTranslateService.translate('file-systems-add'),
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
                    confirmTitle: 'file-server-delete-confirmation',
                    confirmMessage: 'file-server-detail-delete-confirmation',
                    enabled: function () {
                        return true;
                    },
                    onClick: function () {
                        orchestratorService.deleteEvs(storageSystemId, evsId);
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
                        $location.path(['storage-systems', storageSystemId, 'vfs', evsId, 'update'].join('/'));
                    }
                },
                {
                    icon: 'icon-lock',
                    tooltip :'action-tooltip-disable',
                    type: 'confirm',
                    confirmTitle: 'file-server-disable-confirmation',
                    confirmMessage: 'file-server-disable-current-content',
                    enabled: function () {
                        return result.enabled;
                    },
                    onClick: function () {
                        var payload = {'enabled': 'false'};
                        orchestratorService.patchEvs(storageSystemId, evsId, payload);
                    }
                },
                {
                    icon: 'icon-unlock',
                    tooltip :'action-tooltip-enable',
                    type: 'confirm',
                    confirmTitle: 'file-server-enable-confirmation',
                    confirmMessage: 'file-server-enable-current-content',
                    enabled: function () {
                        return !result.enabled;
                    },
                    onClick: function () {
                        var payload = {'enabled': 'true'};
                        orchestratorService.patchEvs(storageSystemId, evsId, payload);
                    }
                }
            ];

            summaryModel.getActions = function () {
                return summaryModelActions;
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
                $location.path(['storage-systems', storageSystemId, 'vfs', evsId, 'file-systems', 'add'].join('/'));
            };


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
                        $location.path(['storage-systems', storageSystemId, 'file-systems',
                            _.first(dataModel.getSelectedItems()).id, 'update'
                        ].join('/'));
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
                        switchEnabled: false,
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
                        if (this.dialogSettings.switchEnabled) {
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
