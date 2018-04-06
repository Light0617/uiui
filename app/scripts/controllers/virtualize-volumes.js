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
        $q,
        $scope,
        $routeParams,
        $timeout,
        $window,
        $location,
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
        donutService,
        storagePortsService,
        portDiscoverService
        ) {

        /******* Pre Virtualization *******/
        var storageSystemId = $routeParams.storageSystemId;
        var getSortedStoragePortsPath = 'storage-ports' + '?sort=storagePortId:ASC';
        var isAddExtVolume = $location.path().includes('external-volumes');
        var portsInfo = function (paths) {
            return _.map(paths, function (p) {
                return previrtualizeService.createPrevirtualizePayloadPortInfo(
                    p.serverEndPoint,
                    p.preVirtualizePayload ? p.preVirtualizePayload.targetWwn : undefined,
                    // TODO for iSCSI Virtualize
                    undefined
                );
            });
        };


        if(ShareDataService.selectedVirtualizeVolumes){
            storageSystemId = ShareDataService.selectedVirtualizeVolumes[0].storageSystemId;
        }
        else if (!isAddExtVolume) {
            $location.path(['/storage-systems/', storageSystemId, '/volumes/'].join(''));
        }

        $scope.dataModel = {
            isPrevirtualize: true,
            isVirtualizeVolume: true,
            isAddExtVolume: isAddExtVolume,
            targetCoordinates: {},
            sourceCoordinates: {},
            selectedType : '',
            readyDefer: $q.defer(),
            portLunMap: {},
            type: ['FIBRE', 'ISCSI'],
            iscsiPaths: [],
            fibrePaths: [],
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
                            storageSystemId,
                            $scope.dataModel.selectedTarget.storageSystemId,
                            portsInfo($scope.dataModel.pathModel.paths),
                            volumeIds
                        );
                        $scope.dataModel.isWaiting = true;

                        if(isAddExtVolume) {
                            getVolumes(storageSystemId, $scope.dataModel.pathModel.paths);
                        }else {
                            previrtualizeService.previrtualizeAndDiscover(payload).then(function () {
                                // TODO Actual Discovered volume should be listed
                                var externalPath = portDiscoverService.createExternalPath(
                                    $scope.dataModel.pathModel.paths, $scope.dataModel.pathModel.sourcePorts
                                );
                                return portDiscoverService.discoverManagedVolumes(
                                    externalPath,
                                    volumeIds,
                                    storageSystemId,
                                    $scope.dataModel.selectedTarget.storageSystemId
                                );
                            }).then(function (volumes) {
                                if(!volumes.length) {
                                    // TODO make sure the message
                                    return $q.reject('Failed to discover');
                                }
                                $scope.dataModel.displayList = [];
                                $scope.dataModel.cachedList = [];
                                _.forEach(volumes, objectTransformService.transformVolume);
                                $scope.dataModel.displayList = volumes;
                                initView($scope.dataModel.displayList);
                                $scope.dataModel.goNext();
                            }).catch(function (e) {
                                // TODO Show dialog and disable next
                                console.log(e);
                            }).finally(function () {
                                $scope.dataModel.isWaiting = false;
                            });
                        }
                    }
                },
                validation: true,
                itemSelected: false
            }
        };

        $scope.dataModel.selectedVolumes = ShareDataService.selectedVirtualizeVolumes;

        function getTargetPorts() {
            paginationService.get(null, getSortedStoragePortsPath, objectTransformService.transformPort, true, $scope.dataModel.selectedTarget.storageSystemId).then(function (result) {
                //Filter out vsmPorts and allow only EXTERNAL_INITIATOR_PORT enabled ports
                $scope.dataModel.pathModel.storagePorts = _.filter(result.resources, function(port) {
                    return !port.vsmPort && _.find(port.attributes, function(attr) {
                         return attr === 'External';
                     });
                });
                $scope.dataModel.pathModel.viewBoxHeight = virtualizeVolumeService.getViewBoxHeight($scope.dataModel.pathModel.sourcePorts, $scope.dataModel.pathModel.storagePorts,
                    $scope.dataModel.sourceCoordinates, $scope.dataModel.targetCoordinates);
                if(!$scope.dataModel.isAddExtVolume) {
                    $scope.dataModel.readyDefer.promise.then($scope.dataModel.build);
                }
            });
        }

        paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result) {
            var dataModel = $scope.dataModel;
            dataModel.selectedTarget = result[0];
            dataModel.storageSystems = result;

            paginationService.get(null, getSortedStoragePortsPath, objectTransformService.transformPort, true, storageSystemId).then(function (result) {
                //Filter out vsmPorts and allow only TARGET_PORT enabled ports
                $scope.dataModel.pathModel.sourcePorts = _.filter(result.resources, function(port) {
                    return !port.vsmPort && _.find(port.attributes, function(attr) {
                        return attr === 'Target';
                    });
                });
                $scope.dataModel.pathModel.FcSourcePorts = _.filter($scope.dataModel.pathModel.sourcePorts, function(port){
                    return port.type === 'FIBRE';
                });
                $scope.dataModel.pathModel.IscsiSourcePorts = _.filter($scope.dataModel.pathModel.sourcePorts, function(port){
                    return port.type === 'ISCSI';
                });

                $scope.dataModel.pathModel.sourcePorts = $scope.dataModel.pathModel.FcSourcePorts;
                paginationService.get(null, getSortedStoragePortsPath, objectTransformService.transformPort, true, $scope.dataModel.isAddExtVolume ? storageSystemId : $scope.dataModel.selectedTarget.storageSystemId).then(function (result) {
                    $scope.dataModel.pathModel.storagePorts = _.filter(result.resources, function(port) {
                        return !port.vsmPort && _.find(port.attributes, function(attr) {
                             return attr === 'External';
                         });
                    });
                    $scope.dataModel.pathModel.FcStoragePorts = _.filter($scope.dataModel.pathModel.storagePorts, function(port){
                        return port.type === 'FIBRE';
                    });
                    $scope.dataModel.pathModel.IscsiStoragePorts = _.filter($scope.dataModel.pathModel.storagePorts, function(port){
                        return port.type === 'ISCSI';
                    });

                    $scope.dataModel.pathModel.storagePorts = $scope.dataModel.pathModel.FcStoragePorts;

                    $scope.dataModel.pathModel.viewBoxHeight = virtualizeVolumeService.getViewBoxHeight($scope.dataModel.pathModel.sourcePorts, $scope.dataModel.pathModel.storagePorts,
                        $scope.dataModel.sourceCoordinates, $scope.dataModel.targetCoordinates);
                    $scope.$watch('dataModel.selectedTarget', function() {
                        getTargetPorts();
                    });
                    $scope.$watchCollection('dataModel.pathModel.paths', function () {
                        $scope.dataModel.selectModel.itemSelected = $scope.dataModel.pathModel.paths.length > 0;
                    });
                });
            });

            if($scope.dataModel.isAddExtVolume){
                angular.extend($scope.dataModel, viewModelService.newWizardViewModel(['selectPorts', 'selectDiscoveredVolumes', 'selectServer', 'paths']));
                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storagePortSearch', true);
                selectPorts(storageSystemId);
            }else {
                angular.extend($scope.dataModel, viewModelService.newWizardViewModel(['selectSourcePort', 'selectDiscoveredVolumes', 'selectServer', 'paths']));
                $scope.dataModel.readyDefer.promise.then($scope.dataModel.build);
            }
        });

        $scope.dataModel.switchType = function () {
            $scope.dataModel.deleteAllLines($scope.dataModel.pathModel);
            if($scope.dataModel.selectedType === 'FIBRE') {
                $scope.dataModel.iscsiPaths = $scope.dataModel.pathModel.paths;
                $scope.dataModel.pathModel.paths = $scope.dataModel.fibrePaths;
                $scope.dataModel.pathModel.viewBoxHeight = virtualizeVolumeService.getViewBoxHeight($scope.dataModel.pathModel.FcSourcePorts, $scope.dataModel.pathModel.FcStoragePorts,
                    $scope.dataModel.sourceCoordinates, $scope.dataModel.targetCoordinates);
                $scope.dataModel.pathModel.storagePorts = $scope.dataModel.pathModel.FcStoragePorts;
                $scope.dataModel.pathModel.sourcePorts = $scope.dataModel.pathModel.FcSourcePorts;
            }else if($scope.dataModel.selectedType === 'ISCSI') {
                $scope.dataModel.fibrePaths = $scope.dataModel.pathModel.paths;
                $scope.dataModel.pathModel.paths = $scope.dataModel.iscsiPaths;
                $scope.dataModel.pathModel.viewBoxHeight = virtualizeVolumeService.getViewBoxHeight($scope.dataModel.pathModel.IscsiSourcePorts, $scope.dataModel.pathModel.IscsiStoragePorts,
                    $scope.dataModel.sourceCoordinates, $scope.dataModel.targetCoordinates);
                $scope.dataModel.pathModel.storagePorts = $scope.dataModel.pathModel.IscsiStoragePorts;
                $scope.dataModel.pathModel.sourcePorts = $scope.dataModel.pathModel.IscsiSourcePorts;
            }else{
                $scope.dataModel.pathModel.viewBoxHeight = virtualizeVolumeService.getViewBoxHeight($scope.dataModel.pathModel.sourcePorts, $scope.dataModel.pathModel.storagePorts,
                    $scope.dataModel.sourceCoordinates, $scope.dataModel.targetCoordinates);
            }
            $scope.dataModel.build(true);
        };


        /******* Select Port(Create Ext Volume Page) *******/
        var selectPorts = function(storageSystemId){

            //add for button
            // var noAvailableArray = false;
            var dataModelPort = {
                storageSystemId : storageSystemId,
                selectedType: 'FIBRE',
                displayList : []
            };

            dataModelPort.selectPortModel = {
                confirmTitle: synchronousTranslateService.translate('select-discovered-volumes-confirmation'),
                confirmMessage: synchronousTranslateService.translate('select-discovered-volumes'),

                canGoNext: function () {
                    return $scope.dataModel.selectPortModel.itemSelected;
                },
                next: function () {
                    if (dataModelPort.selectPortModel.canGoNext && dataModelPort.selectPortModel.canGoNext()) {
                        $scope.dataModel.selectPortDisplayList = $scope.dataModel.displayList;
                        $scope.dataModel.selectPortCachedList = $scope.dataModel.cachedList;
                        $scope.dataModel.selectedPorts = $scope.dataModel.getSelectedItems();
                        discoverUnmanagedLuns();
                        $scope.dataModel.goNext();
                    }
                },
                validation: true,
                itemSelected: false
            };

            function discoverUnmanagedLuns() {
                var portIds = _.map($scope.dataModel.selectedPorts, function(p) { return p.storagePortId ;});
                $scope.dataModel.isWaiting = true;
                $scope.dataModel.cachedList = [];
                $scope.dataModel.displayList = [];
                portDiscoverService.discoverUnmanagedLuns(portIds, storageSystemId).then(function(result) {
                    result = result ? result : [];
                    objectTransformService.transformDiscoveredLun(result);
                    $scope.dataModel.displayList = result;
                    initView($scope.dataModel.displayList);
                }).finally(function () {
                    $scope.dataModel.isWaiting = false;
                });
            }

            angular.extend($scope.dataModel, dataModelPort);

            $scope.dataModel.switchPortType = function(){
                storagePortsService.initPorts($scope.dataModel.selectedType, $scope).then(storagePortsService.defaultSort);
            };

            function select(typeName) {
                $scope.dataModel.selectedType = typeName;
                $scope.dataModel.switchPortType();
            }

            storagePortsService.storageSystemModel().then(function (result) {
                $scope.storageSystemModel = result;
                return storagePortsService.initSummary(hwAlertService);
            }).then(function (result) {
                $scope.summaryModel = result;
                select('FIBRE');
                if($scope.dataModel.displayList.length === 0 || $scope.dataModel.displayList === 'undefined'){
                    $scope.dataModel.selectedType = 'FIBRE';
                    $scope.dataModel.switchPortType();
                }
            });

            $scope.updateSelected = function () {
                var storagePort;
                for (var i = 0; i < $scope.dataModel.displayList.length; ++i) {
                    storagePort = $scope.dataModel.displayList[i];
                    if (storagePort.selected) {
                        ShareDataService.editStoragePort = storagePort;
                        ShareDataService.storageSystemModel = $scope.storageSystemModel;
                        $window.location.href = '#/storage-systems/' + storageSystemId + '/storage-ports/' + storagePort.storagePortId + '/update';
                    }
                }
            };
            $scope.$watch('dataModel.displayList', function () {
                $scope.dataModel.selectPortModel.itemSelected = $scope.dataModel.anySelected();
            }, true);
        };



        /******* Discover Luns *******/
        //add for button
        // var VALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-valid-tooltip');

        var updateResultTotalCounts = function(result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = result.resources;
            $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        };

        var updateDiscoveredLunsTotalCounts = function(portId){
            $scope.dataModel.total = $scope.dataModel.portLunMap[portId].length;

            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.displayList.length
            };
        };

        $scope.dataModel.discoverLuns = function(portId){
            $scope.dataModel.displayList = [];

            if($scope.dataModel.portLunMap[portId]){
                _.each($scope.dataModel.portLunMap[portId], function (port) {
                    $scope.dataModel.displayList.push(port);
                });
                updateDiscoveredLunsTotalCounts(portId);

            }else {
                orchestratorService.discoveredLuns(storageSystemId, portId).then(function (luns) {
                    objectTransformService.transformDiscoveredLun(luns);
                    $scope.dataModel.portLunMap[portId] = luns;
                }).then(function () {
                    _.each($scope.dataModel.portLunMap[portId], function (port) {
                        $scope.dataModel.displayList.push(port);
                    });
                    updateDiscoveredLunsTotalCounts(portId);
                });
            }
        };

        var getVolumes = function (storageSystemId, ports){
            $scope.dataModel.displayList = [];
            $scope.dataModel.cachedList = [];
            var payload = {
               'wwn': null,
               'iscsiInfo': null
            };
            _.each(ports, function(port){
                orchestratorService.discoveredLuns(storageSystemId, port.storagePortId, payload).then(function (luns) {
                    objectTransformService.transformDiscoveredLun(luns);
                    $scope.dataModel.portLunMap[port.storagePortId] = luns;
                }).then(function () {
                    _.each($scope.dataModel.portLunMap[port.storagePortId], function (lun) {
                        $scope.dataModel.displayList.push(lun);
                    });
                    updateDiscoveredLunsTotalCounts(port.storagePortId);

                }).finally(function () {
                    $scope.dataModel.isWaiting = false;
                });
            });

            initView($scope.dataModel.displayList);
            if(!$scope.dataModel.isAddExtVolume) {
                $scope.dataModel.goNext();
            }
        };

        var initView = function (result){
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
                    setSort: function () {
                        //Sort discover
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
                validation: true,
                itemSelected: false,
            };

            dataModelVolume.targetPorts = $scope.dataModel.pathModel.paths;

            angular.extend($scope.dataModel, dataModelVolume);

            $scope.$watch('dataModel.displayList', function () {
                //check if there's any volume requires ddm
                $scope.dataModel.hasVolumeRequireDdm = _.find($scope.dataModel.displayList, function(item){
                    return item.selected && item.requireDDM;
                });

                if($scope.dataModel.hasVolumeRequireDdm) {
                    //check pool summary if ddm pool is available
                    var ddmAvailable = false;
                    orchestratorService.storagePoolsSummary(storageSystemId).then(function (result) {
                        ddmAvailable = result.ddmAvailable;
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
                    dataModelVolume.volumeDataModel.confirmMessage =  synchronousTranslateService.translate('select-discovered-volumes');
                    dataModelVolume.volumeDataModel.itemSelected = _.filter($scope.dataModel.displayList, function (item) { return item.selected; }).length > 0;
                }
            }, true);

            //distinguish between pre-virtualization pathModel and create paths pathModel
            $scope.dataModel.preVirtualizationPaths = $scope.dataModel.pathModel.paths;
            $scope.dataModel.preVirtualizationSourcePorts = $scope.dataModel.pathModel.sourcePorts;
            $scope.dataModel.preVirtualizationStoragePorts = $scope.dataModel.pathModel.storagePorts;

            //clear the paths
            $scope.dataModel.pathModel.paths = [];
            $scope.dataModel.pathModel.sourcePorts = [];
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
                            total: $scope.dataModel.displayList.length
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
                canSubmit: function () {
                    return ($scope.dataModel.pathModel.paths.length > 0);
                },

                //TODO: next step of confirmation needs further discussion
                submit: function () {
                    if (dataModelCreatePath.createPathModel.canSubmit && dataModelCreatePath.createPathModel.canSubmit()) {
                        var payload = virtualizeVolumeService.constructVirtualizePayload($scope.dataModel);
                        orchestratorService.virtualizeVolumes(storageSystemId, payload).then(function() { window.history.back(); });
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
