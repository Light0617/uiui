'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:HostsCtrl
 * @description
 * # HostsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('HostsCtrl', function (
        $scope, $timeout, orchestratorService, objectTransformService, synchronousTranslateService,
        scrollDataSourceBuilderServiceNew, ShareDataService, queryService,
        paginationService, constantService, $location, donutService, replicationService,
        attachVolumeService
    ) {

        $scope.operatingSystemType = {};
        $scope.operatingSystems = constantService.osType();
        queryService.clearQueryMap();
        var GET_HOSTS_PATH = 'compute/servers';

        var osNames = [ { name: 'HP_UX', caption: 'Hewlett-Packard Unix' },
            { name: 'SOLARIS', caption: 'Oracle Solaris' },
            { name: 'AIX', caption: 'IBM AIX' },
            { name: 'TRU64', caption: 'Tru64 Unix' },
            { name: 'WIN', caption: 'Windows' },
            { name: 'WIN_EX', caption: 'Windows EX' },
            { name: 'LINUX', caption: 'Linux' },
            { name: 'VMWARE', caption: 'VMware' },
            { name: 'VMWARE_EX', caption: 'VMware EX' },
            { name: 'UVM', caption: 'UVM' },
            { name: 'NETWARE', caption: 'Netware' },
            { name: 'OVMS', caption: 'OVMS' } ];
        function translateOsName(osName)
        {
            for(var i = 0; i < osNames.length; i++)
            {
                if (osNames[i].name === osName)
                {
                    return osNames[i].caption;
                }
            }
            return osName;
        }

        orchestratorService.hostsSummary().then(function (result) {
            var summaryModel = donutService.hostSummary();

            summaryModel.totalHost = result.totalHost;
            for (var i = 0; i < $scope.operatingSystems.length; ++i) {
                if (!result.osTypeCount[$scope.operatingSystems[i]]) {
                    continue;
                }
                summaryModel.data.push({
                    label: translateOsName($scope.operatingSystems[i]),
                    value: result.osTypeCount[$scope.operatingSystems[i]]
                });
            }
            summaryModel.title = synchronousTranslateService.translate('common-hosts');

            $scope.summaryModel = summaryModel;
        });

        function handleServer(host) {
            objectTransformService.transformHost(host);

            host.metaData[0].details.push(host.attachedVolumeCount + ' volume(s)');
        }

        paginationService.get(null, GET_HOSTS_PATH, handleServer, true).then(function (result) {
            var hosts = result.resources;

            var dataModel = {
                hosts: hosts,
                view: 'tile',
                allItemsSelected: false,
                nextToken: result.nextToken,
                total: result.total,
                busy: false,
                sort: {
                    field: 'serverId',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                queryService.setSort(f, !$scope.dataModel.sort.reverse);
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            } else {
                                $scope.dataModel.sort.field = f;
                                queryService.setSort(f, false);
                                $scope.dataModel.sort.reverse = false;
                            }

                            paginationService.getQuery(GET_HOSTS_PATH, handleServer).then(function(result) {
                                updateResultTotalCounts(result);
                            });
                        });
                    }
                }
            };

            var actions = [
                {
                    icon: 'icon-delete',
                    type: 'confirm',
                    tooltip: 'action-tooltip-delete',
                    confirmTitle: 'host-delete-confirmation',
                    confirmMessage: 'host-delete-selected-content',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    onClick: function () {
                        _.forEach(dataModel.getSelectedItems(), function (item) {
                            item.actions.delete.onClick(orchestratorService, false);
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
                        var item = _.first(dataModel.getSelectedItems());
                        item.actions.edit.onClick();
                    }
                },
                {
                    icon: 'icon-attach-volume',
                    tooltip: 'action-tooltip-attach-volumes',
                    type: 'dropdown',
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    items: [
                        {
                            type: 'link',
                            title: 'host-attach-existing-volumes',
                            onClick: function () {
                                attachVolumeService.invokeServerProtocolCheckAndOpen(
                                    dataModel.getSelectedItems(),
                                    'hosts/attach-volumes'
                                );
                            }
                        },
                        {
                            type: 'link',
                            title: 'host-create-attach-protect-volumes',
                            onClick: function () {
                                attachVolumeService.invokeServerProtocolCheckAndOpen(
                                    dataModel.getSelectedItems(),
                                    'hosts/create-and-attach-volumes'
                                );
                            }
                        }
                    ]
                }
            ];
            dataModel.getActions = function () {
                return actions;
            };

            dataModel.addAction = function () {
                $location.path(['hosts', 'add'].join('/'));
            };

            dataModel.gridSettings = [
                {
                    title: 'hosts-id',
                    sizeClass: 'twelfth',
                    sortField: 'serverId',
                    getDisplayValue: function (item) {
                        return item.serverId;
                    },
                    type: 'id'

                },
                {
                    title: 'hosts-label',
                    sizeClass: 'sixth',
                    sortField: 'serverName',
                    getDisplayValue: function (item) {
                        return item.serverName;
                    }

                },
                {
                    title: 'hosts-ip-address',
                    sizeClass: 'sixth',
                    sortField: 'ipAddress',
                    getDisplayValue: function (item) {
                        return item.ipAddress;
                    }

                },
                {
                    title: 'hosts-protocol',
                    sizeClass: 'sixth',
                    sortField: 'protocol',
                    getDisplayValue: function (item) {
                        return item.protocolDisplayValue;
                    }
                },
                {
                    title: 'hosts-volume-count',
                    sizeClass: 'twelfth',

                    sortField: 'attachedVolumeCount',
                    getDisplayValue: function (item) {
                        return item.attachedVolumeCount;
                    }

                },
                {
                    title: 'hosts-data-protection-type',
                    sizeClass: 'sixth',
                    sortField: 'dataProtectionSummary.replicationType',
                    getDisplayValue: function (item) {
                        return item.displayedDpType;
                    },
                    getToolTipValue: function (item) {
                        return _.map(item.dataProtectionSummary.replicationType, function (type) {
                            return replicationService.tooltip(type);
                        }).join(', ');
                    },
                    type: 'dpType'

                }
            ];

            dataModel.getResources = function(){
                return paginationService.get($scope.dataModel.nextToken, GET_HOSTS_PATH, handleServer, false);
            };

            dataModel.cachedList = result.resources;
            dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

            $scope.dataModel = dataModel;

            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, hosts, 'hostSearch');
        });

        var updateResultTotalCounts = function(result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = result.resources;
            $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        $scope.filterModel = {
            $replicationRawTypes: replicationService.rawTypes,
            $dataProtectionCoverage: constantService.dataProtectionCoverage,
            showAllFilters: true,
            filterOperatingSystem: function () {
                var enabledOperatingSystemType = [];
                var operatingSystemType = $scope.filterModel.operatingSystemType;
                for (var key in  operatingSystemType) {
                    if (operatingSystemType[key]) {
                        enabledOperatingSystemType.push(key);
                    }
                }
                $scope.filterModel.filter.osType = enabledOperatingSystemType;
            },
            filterDpType: function () {
                var replicationTypes = [];
                if ($scope.dataModel.snapshot) {
                    replicationTypes.push($scope.filterModel.$replicationRawTypes.SNAP);
                }
                if ($scope.dataModel.cloneNow) {
                    replicationTypes.push($scope.filterModel.$replicationRawTypes.CLONE);
                }
                $scope.filterModel.filter.replicationTypes = replicationTypes;
            },
            filter: {
                freeText: '',
                status: '',
                protocol: null,
                osType: null,
                replicationType: null,
                snapshot: false,
                clone: false
            },
            arrayType: (new paginationService.SearchType()).ARRAY,
            stringType: (new paginationService.SearchType()).STRING,
            filterQuery: function (key, value, type, arrayClearKey) {
                var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                paginationService.setFilterSearch(queryObject);
                paginationService.getQuery(GET_HOSTS_PATH, handleServer).then(function(result) {
                    updateResultTotalCounts(result);
                });
            },
            searchQuery: function (value) {
                var queryObjects = [];
                queryObjects.push(new paginationService.QueryObject('serverId', new paginationService.SearchType().INT, value));
                queryObjects.push(new paginationService.QueryObject('serverName', new paginationService.SearchType().STRING, value));
                paginationService.setTextSearch(queryObjects);
                paginationService.getQuery(GET_HOSTS_PATH, handleServer).then(function(result) {
                    updateResultTotalCounts(result);
                });
            }
        };

    });
