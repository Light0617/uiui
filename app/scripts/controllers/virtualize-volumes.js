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
        virtualizeVolumeService,
        previrtualizeService,
        donutService) {

        /******* Pre Virtualization *******/
        var storageSystemId = ShareDataService.selectedVirtualizeVolumes[0].storageSystemId;
        var getSortedStoragePortsPath = 'storage-ports' + '?sort=storagePortId:ASC';
        var portsInfo = function (paths) {
            return _.map(paths, function (p) {
                return previrtualizeService.createPrevirtualizePayloadPortInfo(
                    p.storagePortId,
                    p.preVirtualizePayload ? p.preVirtualizePayload.targetWwn : undefined,
                    // TODO for iSCSI Virtualize
                    undefined
                );
            });
        };
        $scope.dataModel = {
            isPrevirtualize: true,
            isVirtualizeVolume: true,
            targetCoordinates: {},
            sourceCoordinates: {},
            selectedType : "",
            type: ["FIBRE", "ISCSI"],
            pathModel: {
                paths: [],
                viewBoxHeight: 0,
                sourcePorts: [],
                getPath: function getPath(path){
                    return attachVolumeService.createPath(112, $scope.dataModel.sourceCoordinates[path.preVirtualizePayload.srcPort].y,
                        $scope.dataModel.targetCoordinates[path.storagePortId].x, $scope.dataModel.targetCoordinates[path.storagePortId].y);
                },
                createPath: attachVolumeService.createPath,
                storagePorts: []
            },
            selectModel: {
                confirmTitle: synchronousTranslateService.translate('select-path-confirmation'),
                confirmMessage: synchronousTranslateService.translate('select-path'),
                canGoNext: function () {
                    return ($scope.dataModel.pathModel.paths.length > 0);
                },
                next: function () {
                    if ($scope.dataModel.selectModel.canGoNext && $scope.dataModel.selectModel.canGoNext()) {
                        var volumeIds = _.map(
                            $scope.dataModel.selectedVolumes,
                            function(vol) { return vol.volumeId; }
                        );

                        var payload = previrtualizeService.createPrevirtualizePayload(
                            $scope.dataModel.selectedTarget.storageSystemId,
                            portsInfo($scope.dataModel.pathModel.paths),
                            volumeIds
                        );
                        // orchestratorService.previrtualizeVolumes(storageSystemId, payload);
                        $scope.dataModel.isWaiting = true;
                        previrtualizeService.previrtualizeAndDiscover(payload).then(function (volumes) {
                            // TODO Actual Discovered volume should be listed
                            $scope.dataModel.isWaiting = false;
                            console.log(volumes);
                            getVolumes(storageSystemId);
                        });
                    }
                },
                validation: true,
                itemSelected: false
            }
        };

        $scope.dataModel.selectedVolumes = ShareDataService.selectedVirtualizeVolumes;

        function getTargetPorts() {
            paginationService.get(null, getSortedStoragePortsPath, objectTransformService.transformPort, true, $scope.dataModel.selectedTarget.storageSystemId).then(function (result) {
                $scope.dataModel.pathModel.storagePorts = result.resources;
                $scope.dataModel.pathModel.viewBoxHeight = virtualizeVolumeService.getViewBoxHeight($scope.dataModel.pathModel.sourcePorts, $scope.dataModel.pathModel.storagePorts,
                    $scope.dataModel.sourceCoordinates, $scope.dataModel.targetCoordinates);
                $scope.dataModel.build();
            });
        }

        paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result) {
            var dataModel = $scope.dataModel;
            dataModel.selectedTarget = result[0];
            dataModel.storageSystems = result;

            paginationService.get(null, getSortedStoragePortsPath, objectTransformService.transformPort, true, storageSystemId).then(function (result) {
                $scope.dataModel.pathModel.sourcePorts = result.resources;
                $scope.dataModel.pathModel.FcSourcePorts = _.filter($scope.dataModel.pathModel.sourcePorts, function(port){
                    return port.type === 'FIBRE';
                });
                $scope.dataModel.pathModel.IscsiSourcePorts = _.filter($scope.dataModel.pathModel.sourcePorts, function(port){
                    return port.type === 'ISCSI';
                });
                paginationService.get(null, getSortedStoragePortsPath, objectTransformService.transformPort, true, $scope.dataModel.selectedTarget.storageSystemId).then(function (result) {
                    $scope.dataModel.pathModel.storagePorts = result.resources;
                    $scope.dataModel.pathModel.FcStoragePorts = _.filter($scope.dataModel.pathModel.storagePorts, function(port){
                        return port.type === 'FIBRE';
                    });
                    $scope.dataModel.pathModel.IscsiStoragePorts = _.filter($scope.dataModel.pathModel.storagePorts, function(port){
                        return port.type === 'ISCSI';
                    });

                    $scope.dataModel.pathModel.viewBoxHeight = virtualizeVolumeService.getViewBoxHeight($scope.dataModel.pathModel.sourcePorts, $scope.dataModel.pathModel.storagePorts,
                        $scope.dataModel.sourceCoordinates, $scope.dataModel.targetCoordinates);
                    $scope.$watch('dataModel.selectedTarget', function() {
                        getTargetPorts();
                    });
                    $scope.$watchCollection('dataModel.pathModel.paths', function () {
                        $scope.dataModel.selectModel.itemSelected = $scope.dataModel.pathModel.paths.length > 0;
                    });
                    $scope.dataModel.build();
                });
            });

            angular.extend($scope.dataModel, viewModelService.newWizardViewModel(['selectSourcePort', 'selectDiscoveredVolumes', 'selectServer', 'paths']));

        });

        $scope.dataModel.switchType = function () {
            if($scope.dataModel.selectedType === 'FIBRE') {
                $scope.dataModel.pathModel.viewBoxHeight = virtualizeVolumeService.getViewBoxHeight($scope.dataModel.pathModel.FcSourcePorts, $scope.dataModel.pathModel.FcStoragePorts,
                    $scope.dataModel.sourceCoordinates, $scope.dataModel.targetCoordinates);
                $scope.dataModel.pathModel.storagePorts = $scope.dataModel.pathModel.FcStoragePorts;
                $scope.dataModel.pathModel.sourcePorts = $scope.dataModel.pathModel.FcSourcePorts;
            }else if($scope.dataModel.selectedType === 'ISCSI') {
                $scope.dataModel.pathModel.viewBoxHeight = virtualizeVolumeService.getViewBoxHeight($scope.dataModel.pathModel.IscsiSourcePorts, $scope.dataModel.pathModel.IscsiStoragePorts,
                    $scope.dataModel.sourceCoordinates, $scope.dataModel.targetCoordinates);
                $scope.dataModel.pathModel.storagePorts = $scope.dataModel.pathModel.IscsiStoragePorts;
                $scope.dataModel.pathModel.sourcePorts = $scope.dataModel.pathModel.IscsiSourcePorts;
            }else{
                $scope.dataModel.pathModel.viewBoxHeight = virtualizeVolumeService.getViewBoxHeight($scope.dataModel.pathModel.sourcePorts, $scope.dataModel.pathModel.storagePorts,
                    $scope.dataModel.sourceCoordinates, $scope.dataModel.targetCoordinates);
            }
            $scope.dataModel.deleteAllPaths($scope.dataModel.pathModel);
            $scope.dataModel.build(true);
        };

        /******* Get Volumes *******/
        //add for button
        // var VALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-valid-tooltip');

        var GET_VOLUMES_PATH = 'volumes';

        var updateResultTotalCounts = function(result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = result.resources;
            $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        var getVolumes = function(storageSystemId) {
            paginationService.get(null, GET_VOLUMES_PATH, objectTransformService.transformVolume, true, storageSystemId).then(function (result) {
                paginationService.clearQuery();

                //add for button
                // var noAvailableArray = false;

                var dataModelVolume = {
                    onlyOperation: true,
                    view: 'tile',
                    storageSystemId: storageSystemId,
                    nextToken: result.nextToken,
                    total: result.total,
                    currentPageCount: 0,
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

                dataModelVolume.volumeDataModel = {
                    confirmTitle: synchronousTranslateService.translate('select-discovered-volumes-confirmation'),
                    confirmMessage: synchronousTranslateService.translate('select-discovered-volumes'),

                    canGoNext: function () {
                        return dataModelVolume.volumeDataModel.itemSelected;
                    },
                    next: function () {
                        if (dataModelVolume.volumeDataModel.canGoNext && dataModelVolume.volumeDataModel.canGoNext()) {
                            initializeServer();
                            $scope.filterModel.filterQuery('protocol', $scope.dataModel.selectedType);
                            $scope.dataModel.goNext();
                        }
                    },
                    /*previous: function() {
                        //recover pre-virtualization pathModel
                        $scope.dataModel.pathModel.paths = $scope.dataModel.preVirtualizationPaths;
                        $scope.dataModel.pathModel.sourcePorts = $scope.dataModel.preVirtualizationSourcePorts;
                        $scope.dataModel.goBack();
                        $timeout(function() {
                            $scope.dataModel.build(true);
                        }, 500);
                    },*/
                    validation: true,
                    itemSelected: false,
                };

                $scope.getVolumeFilterModel = {
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
                        $scope.getVolumeFilterModel.filter.previousVolumeType = previousVolumeType;
                    },
                    arrayType: (new paginationService.SearchType()).ARRAY,
                    filterQuery: function (key, value, type, arrayClearKey) {
                        gadVolumeTypeSearchService.filterQuery(key, value, type, arrayClearKey, $scope.getVolumeFilterModel);
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

                angular.extend($scope.dataModel, dataModelVolume);

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');

                dataModelVolume.loadMore = $scope.dataModel.loadMore;

                $scope.$watch('dataModel.displayList', function () {
                    //check if there's any volume requires ddm
                    $scope.dataModel.hasVolumeRequireDdm = _.find($scope.dataModel.displayList, function(item){
                        return item.selected && item.isDDM;
                    });

                    if($scope.dataModel.hasVolumeRequireDdm) {
                        //check pool summary if ddm pool is available
                        var ddmAvailable = false;
                        orchestratorService.storagePoolsSummary(storageSystemId).then(function (result) {
                            ddmAvailable = result.ddm;
                        });
                        if (ddmAvailable) {
                            dataModelVolume.volumeDataModel.itemSelected = true;
                        } else {//else, show popup error message, including link to create ddm pool page.
                            dataModelVolume.volumeDataModel.confirmTitle = 'No DDM Pool Exist';
                            dataModelVolume.volumeDataModel.confirmMessage = 'Go to create pool page to create one.';
                            dataModelVolume.volumeDataModel.confirmMessage.href = $location.path(['storage-systems', storageSystemId, 'storage-pools', 'add'].join('/'));
                            dataModelVolume.volumeDataModel.itemSelected = false;
                        }
                    }else{//If no, just check if there's item selected
                        dataModelVolume.volumeDataModel.confirmTitle = synchronousTranslateService.translate('select-discovered-volumes-confirmation');
                        dataModelVolume.volumeDataModel.confirmMessage =  synchronousTranslateService.translate('select-discovered-volumes'),
                        dataModelVolume.volumeDataModel.itemSelected = $scope.dataModel.anySelected();
                    }
                }, true);

                //distinguish between pre-virtualization pathModel and create paths pathModel
                $scope.dataModel.preVirtualizationPaths = $scope.dataModel.pathModel.paths;
                $scope.dataModel.preVirtualizationSourcePorts = $scope.dataModel.pathModel.sourcePorts;
                $scope.dataModel.preVirtualizationStoragePorts = $scope.dataModel.pathModel.storagePorts;
                //$scope.dataModel.preVirtualizePathModel = $scope.dataModel.pathModel;
                //clear the paths
                $scope.dataModel.pathModel.paths = [];
                $scope.dataModel.pathModel.sourcePorts = [];
                $scope.dataModel.goNext();
            });

        };



        /******* Get Server *******/
        function initializeServer() {
            $scope.operatingSystemType = {};
            $scope.operatingSystems = constantService.osType();
            queryService.clearQueryMap();
            var GET_HOSTS_PATH = 'compute/servers';
            var osNames = _.object(['HP_UX', 'SOLARIS', 'AIX', 'TRU64', 'WIN', 'WIN_EX', 'LINUX', 'VMWARE', 'VMWARE_EX', 'UVM', 'NETWARE', 'OVMS'],
                ['Hewlett-Packard Unix', 'Oracle Solaris', 'IBM AIX', 'Tru64 Unix', 'Windows', 'Windows EX', 'Linux', 'VMware', 'VMware EX', 'UVM', 'Netware', 'OVMS']);

            orchestratorService.hostsSummary().then(function (result) {
                var summaryModel = donutService.hostSummary();

                summaryModel.totalHost = result.totalHost;

                _.each($scope.operatingSystems, function(os){
                    if(result.osTypeCount[os]){
                        summaryModel.data.push({
                            label: osNames[os],
                            value: result.osTypeCount[os]
                        });
                    }
                });

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

                                paginationService.getQuery(GET_HOSTS_PATH, handleServer).then(function (result) {
                                    updateResultTotalCounts(result);
                                });
                            });
                        }
                    }
                };

                // Todo: Add for footer button
                dataModelServer.serverModel = {
                    confirmTitle: synchronousTranslateService.translate('select-server-confirmation'),
                    confirmMessage: synchronousTranslateService.translate('select-server'),
                    canGoNext: function () {
                        return _.some($scope.dataModel.displayList, 'selected');
                    },

                    //TODO: next step of confirmation needs further discussion
                    next: function () {
                        if (dataModelServer.serverModel.canGoNext && dataModelServer.serverModel.canGoNext()) {
                            $scope.dataModel.pathModel.selectedHosts = $scope.dataModel.getSelectedItems();
                            var idCoordinates = {};
                            attachVolumeService.setEndPointCoordinates($scope.dataModel.pathModel.selectedHosts, $scope.dataModel.attachModel.hostModeOptions, idCoordinates);
                            $scope.dataModel.selectServerPath = true;
                            $scope.dataModel.selectedServer = $scope.dataModel.getSelectedItems();
                            $scope.dataModel.isPrevirtualize = false;
                            createPaths();
                            $scope.dataModel.goNext();
                            $scope.dataModel.build(true);
                        }
                    },
                    previous: function () {
                        $scope.dataModel.selectServerPath = false;

                        $scope.dataModel.serverDisplayList = $scope.dataModel.displayList;
                        $scope.dataModel.displayList = $scope.dataModel.volumeDisplayList;
                        $scope.dataModel.serverCachedList = $scope.dataModel.cachedList;
                        $scope.dataModel.cachedList = $scope.dataModel.volumeCachedList;
                        $scope.dataModel.getResources = $scope.dataModel.getVolumeResources;
                        $scope.dataModel.nextToken = null;
                        $scope.dataModel.itemCounts = {
                            filtered: $scope.dataModel.displayList.length,
                            total: $scope.dataModel.volumeCachedList.length
                        };
                        $scope.$watch($scope.dataModel.displayList, function () {
                            $scope.dataModel.itemSelected = _.some($scope.dataModel.displayList, function(item) {
                                return item.selected;
                            });
                        });
                        $scope.dataModel.itemSelected = true;
                        $scope.dataModel.goBack();
                    },
                    validation: true,
                    itemSelected: false
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

                dataModelServer.getServerResources = function () {
                    return paginationService.get($scope.dataModel.nextToken, GET_HOSTS_PATH, handleServer, false);
                };

                dataModelServer.serverCachedList = result.resources;
                $scope.dataModel.serverDisplayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, hosts, 'hostSearch');

                $scope.$watch('dataModel.displayList', function () {
                    dataModelServer.serverModel.itemSelected = $scope.dataModel.anySelected();
                }, true);

                angular.extend($scope.dataModel, dataModelServer);
                $scope.dataModel.selectedDiscoveredVolumes = $scope.dataModel.getSelectedItems();
                $scope.dataModel.volumeDisplayList = $scope.dataModel.displayList;
                $scope.dataModel.displayList = $scope.dataModel.serverDisplayList;
                $scope.dataModel.volumeCachedList = $scope.dataModel.cachedList;
                $scope.dataModel.cachedList = $scope.dataModel.serverCachedList;
                $scope.dataModel.getVolumeResources = $scope.dataModel.getResources;
                $scope.dataModel.getResources = $scope.dataModel.getServerResources;
                $scope.dataModel.nextToken = null;
            });


            $scope.filterModel = {
                $replicationRawTypes: replicationService.rawTypes,
                showAllFilters: true,
                filter: {
                    freeText: '',
                    status: '',
                    osType: null,
                    replicationType: null,
                    snapshot: false,
                    clone: false,
                    protocol: $scope.dataModel.selectedType
                },
                arrayType: (new paginationService.SearchType()).ARRAY,
                filterQuery: function (key, value, type, arrayClearKey) {
                    var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                    paginationService.setFilterSearch(queryObject);
                    paginationService.getQuery(GET_HOSTS_PATH, handleServer).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('serverId', new paginationService.SearchType().INT, value));
                    queryObjects.push(new paginationService.QueryObject('serverName', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(GET_HOSTS_PATH, handleServer).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                }
            };

            var autoSelect = 'AUTO';

            var hostModes = constantService.osType();
            hostModes.splice(0, 0, autoSelect);

            orchestratorService.storageSystemHostModeOptions(storageSystemId).then(function (results) {

                paginationService.getAllPromises(null, 'host-groups', false, storageSystemId, null, false).then(function (hostGroupResults) {
                    var hostModeOption = attachVolumeService.getMatchedHostModeOption(hostGroupResults);
                    $scope.dataModel.attachModel = {
                        lastSelectedHostModeOption: hostModeOption,
                        hostModes: hostModes,
                        hostMode: attachVolumeService.getMatchedHostMode(hostGroupResults, hostModes[0]),
                        selectedHostModeOption: hostModeOption,
                        hostModeOptions: results,
                        selectedHostMode: undefined
                    };
                    $scope.$watch('dataModel.attachModel.hostMode', function (newVal) {
                        $scope.dataModel.attachModel.selectedHostMode = newVal;
                    });
                });
            });

            $scope.dataModel.checkSelectedHostModeOptions = function () {
                attachVolumeService.checkSelectedHostModeOptions($scope.dataModel);
            };

        }

        /******* Create Paths *******/
        function createPaths() {
            var dataModelCreatePath = {};
            // Todo: Add for footer button
            dataModelCreatePath.createPathModel = {
                canGoNext: function () {
                    return ($scope.dataModel.pathModel.paths.length > 0);
                },

                //TODO: next step of confirmation needs further discussion
                next: function () {
                    if (dataModelCreatePath.createPathModel.canGoNext && dataModelCreatePath.createPathModel.canGoNext()) {
                        var payload = {
                            targetPortForSrcVol: [],
                            serverInfos: [],
                            lunns: []
                        };
                        _.each($scope.dataModel.preVirtualizationPaths, function (path) {
                            payload.targetPortForSrcVol.push(path.storagePortId);
                        });
                        _.each($scope.dataModel.pathModel.paths, function (path) {
                            var serverInfo = {
                                targetPortForHost: path.storagePortId,
                                serverWwn: path.serverEndPoint,
                                hostMode: $scope.dataModel.attachModel.selectedHostMode,
                                hostModeOpts: $scope.dataModel.attachModel.selectedHostModeOption
                            };
                            payload.serverInfos.push(serverInfo);
                        });
                        _.each($scope.dataModel.selectedDiscoveredVolumes, function (vol) {
                            console.log(vol);
                            payload.lunns.push(vol.volumeId);
                        });
                        console.log(payload);
                        orchestratorService.virtualizeVolumes(storageSystemId, payload);
                        $scope.dataModel.goNext();
                    }
                },
                previous: function () {
                    //distinguish between pre-virtualization pathModel and create paths pathModel
                    $scope.dataModel.pathModel.paths = [];
                    $scope.dataModel.goBack();
                },
                validation: true,
                itemSelected: false
            };
            angular.extend($scope.dataModel, dataModelCreatePath);
            // $scope.dataModel.isPrevirtualize = false;
        }
    });
