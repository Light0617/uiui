'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePoolsCtrl
 * @description
 * # StoragePoolsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('EnterpriseVirtualServersCtrl', function ($scope, $routeParams, $timeout, $filter, orchestratorService,
                                                          objectTransformService, synchronousTranslateService, scrollDataSourceBuilderService, $location) {
        var storageSystemId = $routeParams.storageSystemId;

        var getEVSCall = null;

        if (storageSystemId) { // Case of /storage-systems/12345/evs
            getEVSCall = orchestratorService.enterpriseVirtualServers(storageSystemId);
        } else { // Case of /storage-systems/evs
            getEVSCall = orchestratorService.allEnterpriseVirtualServers();
        }

        getEVSCall.then(function (result) {
            var EVSs = result.evses;
            var dataModel = {
                file: true,
                title: synchronousTranslateService.translate('common-storage-system-file-servers'),
                titleTooltip: synchronousTranslateService.translate('evs-tooltip'),
                storageSystemId: storageSystemId,
                view: 'tile',
                allItemsSelected: false,
                search: {
                    freeText: '',
                    isOnline: null,
                    isEnabled: null,
                    blade: null,
                    filterStorageSystem: ''
                },
                sort: {
                    field: 'id',
                    reverse: false,
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
                    confirmTitle: 'file-server-delete-confirmation',
                    confirmMessage: 'file-server-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    onClick: function () {
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            orchestratorService.deleteEvs(item.storageSystemId, item.uuid);
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
                        $location.path(['storage-systems', _.first(dataModel.getSelectedItems()).storageSystemId, 'vfs',
                            _.first(dataModel.getSelectedItems()).uuid, 'update'].join('/'));
                    }
                },
                {
                    icon: 'icon-lock',
                    tooltip: 'action-tooltip-disable',
                    type: 'confirm',
                    confirmTitle: 'file-server-disable-confirmation',
                    confirmMessage: 'file-server-disable-selected-content',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && _.first(dataModel.getSelectedItems()).enabled;
                    },
                    onClick: function () {
                        var payload = {'enabled': 'false'};
                        orchestratorService.patchEvs(_.first(dataModel.getSelectedItems()).storageSystemId, _.first(dataModel.getSelectedItems()).uuid, payload);
                    }
                },
                {
                    icon: 'icon-unlock',
                    tooltip: 'action-tooltip-enable',
                    type: 'confirm',
                    confirmTitle: 'file-server-enable-confirmation',
                    confirmMessage: 'file-server-enable-selected-content',
                    enabled: function () {
                        return dataModel.onlyOneSelected() && !_.first(dataModel.getSelectedItems()).enabled;
                    },
                    onClick: function () {
                        var payload = {'enabled': 'true'};
                        orchestratorService.patchEvs(_.first(dataModel.getSelectedItems()).storageSystemId, _.first(dataModel.getSelectedItems()).uuid, payload);
                    }
                }
            ];

            dataModel.getActions = function () {
                return actions;
            };

            dataModel.gridSettings = [
                {
                    title: synchronousTranslateService.translate('status'),
                    sizeClass: 'twelfth',
                    sortField: 'isOnline',
                    getDisplayValue: function (item) {
                        return item.isOnline ? 'Online' : 'Offline';
                    }
                },
                {
                    title: synchronousTranslateService.translate('enabled'),
                    sizeClass: 'twelfth',
                    sortField: 'isEnabled',
                    getDisplayValue: function (item) {
                        return item.isEnabled;
                    }
                },
                {
                    title: synchronousTranslateService.translate('blade'),
                    sizeClass: 'twelfth',
                    sortField: 'clusterNodeId',
                    getDisplayValue: function (item) {
                        return item.clusterNodeId;
                    }
                },
                {
                    title: synchronousTranslateService.translate('header-name'),
                    sizeClass: 'sixth',
                    sortField: 'name',
                    getDisplayValue: function (item) {
                        return item.name;
                    }

                },
                {
                    title: synchronousTranslateService.translate('common-ip-address'),
                    sizeClass: 'sixth',
                    sortField: 'interfaceAddresses[0].ip',
                    getDisplayValue: function (item) {
                        return _.map(item.interfaceAddresses, function (addresses) {
                            return addresses.ip;
                        }).join(',');
                    }
                }
            ];

            dataModel.addAction = function () {
                if (storageSystemId) {
                    $location.path(['storage-systems', storageSystemId, 'vfs', 'add'].join('/'));
                }
                else {
                    $location.path(['vfs', 'add'].join('/'));
                }
            };

            if (!storageSystemId) {
                var storageSystemIds = [];
                _.each(EVSs, function (evs) {
                    storageSystemIds.push(evs.storageSystemId);
                });
                dataModel.storageSystemIds = _.uniq(storageSystemIds);

            }

            $scope.dataModel = dataModel;
            scrollDataSourceBuilderService.setupDataLoader($scope, EVSs, 'evsSearch');
        });

    });
