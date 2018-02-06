/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2017. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:VirtualizeVolumesCtrl
 * @description
 * # VirtualizeVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('VirtualizeVolumesCtrl', function (
        $scope,
        $routeParams,
        $timeout,
        $window,
        orchestratorService,
        objectTransformService,
        synchronousTranslateService,
        scrollDataSourceBuilderServiceNew,
        ShareDataService,
        attachVolumeService,
        paginationService,
        queryService,
        wwnService,
        hwAlertService,
        storageNavigatorSessionService,
        constantService,
        viewModelService,
        inventorySettingsService,
        replicationService,
        gadVolumeTypeSearchService,
        donutService) {

        //Model the wizard-footer
        $scope.wizardDataModel = {};

        /******* Pre Virtualization *******/
        var storageSystemId = ShareDataService.selectedMigrateVolumes[0].storageSystemId;
        var getSortedStoragePortsPath = 'storage-ports' + '?sort=storagePortId:ASC';
        // var getPortsPath = 'storage-ports';
        // var getPortsSort = '?sort=storagePortId:ASC';
        // var selectedServers = ShareDataService.pop('selectedServers') || [];
        $scope.dataModel = {
            isPrevirtualize: true,
            pathModel: {
                paths: [],
                viewBoxHeight: 0,
                sourcePorts: [],
                getPath: attachVolumeService.getPath,
                createPath: attachVolumeService.createPath,
                storagePorts: []
            },
            selectModel: {
                canGoNext: function () {
                    return $scope.dataModel.pathModel.paths.length;
                },
                next: function () {
                    if ($scope.dataModel.selectModel.canGoNext && $scope.dataModel.selectModel.canGoNext()) {
                        var payload = {
                            portInfo: [],
                            lunPaths: []
                        };

                        _.each($scope.dataModel.pathModel.paths, function(path) {
                            payload.portInfo.push(path.preVirtualizePayload);
                        });
                        _.each(ShareDataService.selectedMigrateVolumes, function(ldev) {
                            payload.lunPaths.push({ ldev: ldev.volumeId });
                        });
                        orchestratorService.previrtualizeVolumes(storageSystemId, payload);
                        $scope.dataModel.goNext();
                    }
                },
                previous: function() {
                    $scope.dataModel.goBack();
                },
                validation: true,
                itemSelected: true
            }
        };

        $scope.dataModel.selectedVolumes = ShareDataService.selectedMigrateVolumes;

        function getViewBoxHeight(sourcePorts, targetPorts){
            attachVolumeService.setPortCoordiantes(sourcePorts, {});
            attachVolumeService.setPortCoordiantes(targetPorts, {});
            var sourceHeight = sourcePorts[sourcePorts.length - 1].coordinate.y + 30;

            var targetHeight = targetPorts[targetPorts.length - 1].coordinate.y + 30;

            return Math.max(sourceHeight, targetHeight);
        }

        function getTargetPorts() {
            paginationService.get(null, getSortedStoragePortsPath, objectTransformService.transformPort, true, $scope.dataModel.selectedTarget.storageSystemId).then(function (result) {
                $scope.dataModel.pathModel.storagePorts = result.resources;
                $scope.dataModel.pathModel.viewBoxHeight = getViewBoxHeight($scope.dataModel.pathModel.sourcePorts, $scope.dataModel.pathModel.storagePorts);
                $scope.dataModel.pathModel.builder();
            });
        }

        paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result) {
            var dataModel = $scope.dataModel;
            dataModel.selectedTarget = result[1];
            dataModel.storageSystems = result;

            paginationService.get(null, getSortedStoragePortsPath, objectTransformService.transformPort, true, storageSystemId).then(function (result) {
                $scope.dataModel.pathModel.sourcePorts = result.resources;
                paginationService.get(null, getSortedStoragePortsPath, objectTransformService.transformPort, true, $scope.dataModel.selectedTarget.storageSystemId).then(function (result) {
                    $scope.dataModel.pathModel.storagePorts = result.resources;
                    $scope.dataModel.pathModel.viewBoxHeight = getViewBoxHeight($scope.dataModel.pathModel.sourcePorts, $scope.dataModel.pathModel.storagePorts);
                    $scope.dataModel.pathModel.builder();
                    $scope.$watch('dataModel.selectedTarget', function() {
                        getTargetPorts();
                    });
                });
            });

            angular.extend($scope.dataModel, viewModelService.newWizardViewModel(['selectSourcePort', 'selectDiscoveredVolumes', 'selectServer', 'paths']));

        });


        /******* Get Volumes *******/
            //add for button
        var VALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-valid-tooltip');

        var GET_VOLUMES_PATH = 'volumes';

        var updateResultTotalCounts = function(result) {
            $scope.dataModel.volumeDataModel.nextToken = result.nextToken;
            $scope.dataModel.volumeDataModel.cachedList = result.resources;
            $scope.dataModel.volumeDataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.volumeDataModel.itemCounts = {
                filtered: $scope.dataModel.volumeDataModel.displayList.length,
                total: $scope.dataModel.volumeDataModel.total
            };
        };

        var getVolumes = function(storageSystemId) {
            paginationService.get(null, GET_VOLUMES_PATH, objectTransformService.transformVolume, true, storageSystemId).then(function (result) {
                paginationService.clearQuery();

                //add for button
                var noAvailableArray = false;

                var dataModelVolume = {
                    onlyOperation: true,
                    view: 'tile',
                    storageSystemId: storageSystemId,
                    nextToken: result.nextToken,
                    total: result.total,
                    currentPageCount: 0,
                    storageSystems: $scope.dataModel.storageSystems,
                    selectedSource: $scope.dataModel.selectedSource,
                    selectedTarget: $scope.dataModel.selectedTarget,
                    busy: false,
                    sort: {
                        field: 'volumeId',
                        reverse: false,
                        setSort: function (f) {
                            $timeout(function () {
                                if ($scope.dataModel.volumeDataModel.sort.field === f) {
                                    queryService.setSort(f, !$scope.dataModel.volumeDataModel.sort.reverse);
                                    $scope.dataModel.volumeDataModel.sort.reverse = !$scope.dataModel.volumeDataModel.sort.reverse;
                                } else {
                                    $scope.dataModel.volumeDataModel.sort.field = f;
                                    queryService.setSort(f, false);
                                    $scope.dataModel.volumeDataModel.sort.reverse = false;
                                }
                                paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function (result) {
                                    updateResultTotalCounts(result);
                                });
                            });
                        }
                    }
                };

                // Todo: Add for footer button
                dataModelVolume.selectModel = {
                    noAvailableArray: noAvailableArray,
                    confirmTitle: synchronousTranslateService.translate('storage-pool-migrate-confirmation'),
                    confirmMessage: synchronousTranslateService.translate('storage-pool-migrate-zero-selected'),
                    canGoNext: function () {
                        //return _.some(dataModel.displayList, 'selected');
                        return true;
                    },

                    //TODO: next step of confirmation needs further discussion
                    next: function () {
                        if (dataModelVolume.selectModel.canGoNext && dataModelVolume.selectModel.canGoNext()) {
                            dataModelVolume.goNext();
                        }
                    },
                    previous: function() {
                        dataModelVolume.goBack();
                    },
                    validation: true,
                    itemSelected: false
                };


                $scope.filterModel = {
                    $replicationRawTypes: replicationService.rawTypes,
                    filter: {
                        freeText: '',
                        volumeType: '',
                        previousVolumeType: '',
                        provisioningStatus: '',
                        dkcDataSavingType: '',
                        replicationType: [],
                        protectionStatusList: [],
                        snapshotex: false,
                        snapshotfc: false,
                        snapshot: false,
                        clone: false,
                        protected: false,
                        unprotected: false,
                        secondary: false,
                        gadActivePrimary: false,
                        gadActiveSecondary: false,
                        gadNotAvailable: false,
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
                        utilization: {
                            min: 0,
                            max: 100
                        }
                    },
                    fetchPreviousVolumeType: function (previousVolumeType) {
                        $scope.filterModel.filter.previousVolumeType = previousVolumeType;
                    },
                    arrayType: (new paginationService.SearchType()).ARRAY,
                    filterQuery: function (key, value, type, arrayClearKey) {
                        gadVolumeTypeSearchService.filterQuery(key, value, type, arrayClearKey, $scope.filterModel);
                        paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function (result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    sliderQuery: function (key, start, end, unit) {
                        paginationService.setSliderSearch(key, start, end, unit);
                        paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function (result) {
                            updateResultTotalCounts(result);
                        });
                    },
                    searchQuery: function (value) {
                        var queryObjects = [];
                        queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().STRING, value));
                        queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                        paginationService.setTextSearch(queryObjects);
                        paginationService.getQuery(GET_VOLUMES_PATH, objectTransformService.transformVolume, storageSystemId).then(function (result) {
                            updateResultTotalCounts(result);
                        });
                    }
                };

                inventorySettingsService.setVolumesGridSettings(dataModelVolume);

                dataModelVolume.cachedList = result.resources;
                dataModelVolume.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                dataModelVolume.getResources = function () {
                    return paginationService.get($scope.dataModel.nextToken, GET_VOLUMES_PATH, objectTransformService.transformVolume, false, storageSystemId);
                };

                dataModelVolume.targetPorts = $scope.dataModel.pathModel.paths;
                $scope.dataModel.volumeDataModel = dataModelVolume;

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');

                $scope.dataModel.selectedVolumes = ShareDataService.selectedMigrateVolumes;
            });
        };

        paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result) {
            var storageSystemId = $scope.dataModel.selectedTarget.storageSystemId;
            getVolumes(storageSystemId);
        });



        /******* Get Server *******/
        /*

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

                    var dataModelServer = {
                        onlyOperation: true,
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
                                    if ($scope.dataModel.serverModel.sort.field === f) {
                                        queryService.setSort(f, !$scope.dataModel.serverModel.sort.reverse);
                                        $scope.dataModel.serverModel.sort.reverse = !$scope.dataModel.serverModel.sort.reverse;
                                    } else {
                                        $scope.dataModel.serverModel.sort.field = f;
                                        queryService.setSort(f, false);
                                        $scope.dataModel.serverModel.sort.reverse = false;
                                    }

                                    paginationService.getQuery(GET_HOSTS_PATH, handleServer).then(function(result) {
                                        updateResultTotalCounts(result);
                                    });
                                });
                            }
                        }
                    };

                    dataModelServer.gridSettings = [
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
                            sortField: 'displayedDpType',
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

                    dataModelServer.getResources = function(){
                        return paginationService.get($scope.dataModel.serverModel.nextToken, GET_HOSTS_PATH, handleServer, false);
                    };

                    dataModelServer.cachedList = result.resources;
                    dataModelServer.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                    scrollDataSourceBuilderServiceNew.setupDataLoader($scope, hosts, 'hostSearch');

                    $scope.dataModel.serverModel = dataModelServer;
                    //order matters
                    $scope.dataModel.serverModel.selectedVolumes = ShareDataService.selectedMigrateVolumes;

                    angular.extend($scope.dataModel, viewModelService.newWizardViewModel(['selectServer', 'paths']));
                });

                var updateResultTotalCounts = function(result) {
                    $scope.dataModel.serverModel.nextToken = result.nextToken;
                    $scope.dataModel.serverModel.cachedList = result.resources;
                    $scope.dataModel.serverModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                    $scope.dataModel.serverModel.itemCounts = {
                        filtered: $scope.dataModel.serverModel.displayList.length,
                        total: $scope.dataModel.serverModel.total
                    };
                };

                $scope.filterModel = {
                    $replicationRawTypes: replicationService.rawTypes,
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
                        if ($scope.dataModel.serverModel.snapshot) {
                            replicationTypes.push($scope.filterModel.$replicationRawTypes.SNAP);
                        }
                        if ($scope.dataModel.serverModel.cloneNow) {
                            replicationTypes.push($scope.filterModel.$replicationRawTypes.CLONE);
                        }
                        $scope.filterModel.filter.replicationTypes = replicationTypes;
                    },
                    filter: {
                        freeText: '',
                        status: '',
                        osType: null,
                        replicationType: null,
                        snapshot: false,
                        clone: false
                    },
                    arrayType: (new paginationService.SearchType()).ARRAY,
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
                */
    });
