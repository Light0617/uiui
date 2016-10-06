'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StorageSystemVolumeAttachCtrl
 * @description
 * # StorageSystemVolumeAttachCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StorageSystemVolumeAttachCtrl', function ($scope, $timeout, orchestratorService, objectTransformService,
                                                           paginationService, queryService, synchronousTranslateService, scrollDataSourceBuilderServiceNew,
                                                           ShareDataService, $location, $routeParams, viewModelService,
                                                           attachVolumeService, constantService, replicationService) {

        var storageSystemId = $routeParams.storageSystemId;
        $scope.canSubmit = true;
        var VALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-valid-tooltip');
        var INVALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-invalid-tooltip');
        var GET_PORTS_PATH = 'storage-ports';
        var GET_HOSTS_PATH = 'compute/servers';
        var GET_HOST_GROUPS_PATH = 'host-groups';
        var dataModel = viewModelService.newWizardViewModel(['select', 'attach', 'paths']);
        var enableSelectPageNextButton = false;

        var selectedVolumes = ShareDataService.pop('selectedVolumes') || [];
        _.forEach(selectedVolumes, function(volume) {
            volume.lun = null;
            volume.decimalNumberRegexp = /^[^.]+$/;
            volume.hasDuplicatedLun = false;
            volume.validationTooltip = VALID_TOOLTIP;
        });

        if (!selectedVolumes || selectedVolumes.length === 0) {
            $location.path('storage-systems/' + storageSystemId + '/volumes');
        }

        $scope.operatingSystemType = {};
        $scope.operatingSystems = constantService.osType();


        function handleHost(host) {
            objectTransformService.transformHost(host);

            host.metaData[0].details.push(host.attachedVolumeCount + ' volume(s)');
        }
        function setHostModeAndHostModeOptions(selectedServers, defaultHostMode, ports) {
            var wwpns = attachVolumeService.getSelectedServerWwpns(selectedServers);
            var queryString = paginationService.getQueryStringForList(wwpns);
            paginationService.clearQuery();
            queryService.setQueryMapEntry('hbaWwns', queryString);
            paginationService.getAllPromises(null, GET_HOST_GROUPS_PATH, false, $scope.dataModel.selectedStorageSystem.storageSystemId, null, false).then(function(hostGroupResults) {
                var hostModeOption = attachVolumeService.getMatchedHostModeOption(hostGroupResults);
                $scope.dataModel.attachModel.hostMode = attachVolumeService.getMatchedHostMode(hostGroupResults, defaultHostMode);
                $scope.dataModel.attachModel.lastSelectedHostModeOption = hostModeOption;
                $scope.dataModel.attachModel.selectedHostModeOption = hostModeOption;
                $scope.dataModel.attachModel.setEnableZoning = function (value) {
                    dataModel.attachModel.enableZoning = value;
                };
                $scope.dataModel.attachModel.setEnableLunUnification = function (value) {
                    dataModel.attachModel.enableLunUnification = value;
                };
                $scope.dataModel.attachModel.canGoNext = function () {
                    return true;
                };
                $scope.dataModel.attachModel.next = function () {
                    if ($scope.dataModel.attachModel.canGoNext && !$scope.dataModel.attachModel.canGoNext()) {
                        return;
                    }

                    $scope.dataModel.attachModel.hostGroups = attachVolumeService.getAllocateLikeFilteredHostGroups(
                        selectedServers,
                        hostGroupResults,
                        $scope.dataModel.attachModel.hostMode,
                        $scope.dataModel.attachModel.selectedHostModeOption);

                    attachVolumeService.setEditLunPage(
                        $scope.dataModel, storageSystemId,
                        selectedVolumes,
                        $scope.dataModel.attachModel.serverPortMapperModel.servers,
                        attachVolumeService.getSelectedHostMode($scope.dataModel),
                        ports,
                        $scope.dataModel.attachModel.hostGroups);

                    $scope.dataModel.goNext();
                };

            }).finally(function(){
                paginationService.clearQuery();
            });
        }

        paginationService.get(null, GET_HOSTS_PATH, handleHost, true).then(function (result) {

            orchestratorService.storageSystem(storageSystemId).then(function(result) {
                $scope.dataModel.storageSystemModel = result.model;
                paginationService.getAll(null, GET_PORTS_PATH, true, storageSystemId, result.model, $scope.dataModel);
            });

            var hosts = result.resources;

            var storageSystem = {
                storageSystemId: storageSystemId
            };

            angular.extend(dataModel, {
                canSubmit: true,
                selectedStorageSystem: storageSystem,
                storageSystems: [storageSystem],
                hosts: hosts,
                view: 'tile',
                allItemsSelected: false,
                nextToken: result.nextToken,
                total: result.total,
                displayList: result.resources,
                search: {
                    freeText: ''
                },
                sort: {
                    field: 'serverId',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            } else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                },
                getSelectedHostCount: function () {
                    var selectedCount = 0;
                    _.forEach($scope.dataModel.displayList, function (host) {
                        if (host.selected === true) {
                            selectedCount++;
                        }
                    });

                    return selectedCount;
                }

            });

            dataModel.selectModel = {
                confirmTitle: synchronousTranslateService.translate('host-attach-confirmation'),
                confirmMessage: synchronousTranslateService.translate('host-attach-zero-selected'),
                canGoNext: function () {
                    return dataModel.getSelectedHostCount() > 0 && enableSelectPageNextButton;
                },
                next: function () {
                    if (dataModel.selectModel.canGoNext && !dataModel.selectModel.canGoNext()) {
                        return;
                    }
                    var selectedServers = _.where(dataModel.displayList, 'selected');
                    dataModel.attachModel.serverPortMapperModel = viewModelService.newServerPortMapperModel(dataModel.attachModel.storagePorts, selectedServers);
                    setHostModeAndHostModeOptions(selectedServers, dataModel.attachModel.defaultHostMode, dataModel.attachModel.storagePorts);
                    dataModel.goNext();
                },
                validation: true,
                itemSelected: false
            };

            dataModel.process = function(resources, token){
                // Only support for fibre port for now
                resources = _.filter(resources, function(storagePort) {
                    return storagePort.type === 'FIBRE';
                });
                _.forEach(resources, function (item) {
                    item.storageSystemModel = dataModel.storageSystemModel;
                    objectTransformService.transformPort(item);
                });

                dataModel.storagePorts = dataModel.storagePorts.concat(resources);

                if (token === null) {
                    afterGetAllPorts(dataModel.storagePorts);
                }
            };
            dataModel.storagePorts = [];
            dataModel.getResources = function(){
                return paginationService.get($scope.dataModel.nextToken, GET_HOSTS_PATH, handleHost, false);
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
            showAllFilters: true,
            filterOperatingSystem: function () {
                var enabledOperatingSystemType = [];
                var operatingSystemType = $scope.filterModel.operatingSystemType;
                for (var key in  operatingSystemType) {
                    if (operatingSystemType[key]) {
                        enabledOperatingSystemType.push(key);
                    }
                }
                $scope.dataModel.search.osType = enabledOperatingSystemType;
            },

            filterDpType: function () {
                var replicationTypes = [];
                if ($scope.dataModel.snapshot) {
                    replicationTypes.push($scope.filterModel.$replicationRawTypes.SNAP);
                }
                if ($scope.dataModel.cloneNow) {
                    replicationTypes.push($scope.filterModel.$replicationRawTypes.CLONE);
                }
                $scope.dataModel.search.replicationTypes = replicationTypes;
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
                paginationService.getQuery(GET_HOSTS_PATH, handleHost).then(function(result) {
                    updateResultTotalCounts(result);
                });
            },
            searchQuery: function (value) {
                var queryObjects = [];
                queryObjects.push(new paginationService.QueryObject('serverId', new paginationService.SearchType().INT, value));
                queryObjects.push(new paginationService.QueryObject('serverName', new paginationService.SearchType().STRING, value));
                paginationService.setTextSearch(queryObjects);
                paginationService.getQuery(GET_HOSTS_PATH, handleHost).then(function(result) {
                    updateResultTotalCounts(result);
                });
            }
        };

        var autoSelect = 'AUTO';

        function afterGetAllPorts(ports) {
            if (!ports) {
                return;
            }

            var hostModes = constantService.osType();
            hostModes.splice(0, 0, autoSelect);

            var dataModel = $scope.dataModel;
            orchestratorService.storageSystemHostModeOptions($scope.dataModel.selectedStorageSystem.storageSystemId).then(function (results) {
                dataModel.attachModel = {
                    storageSystemSelectable: false,

                    lastSelectedHostModeOption: [999],
                    selectedVolumes: selectedVolumes,
                    selectedServers: _.where(dataModel.displayList, 'selected'),
                    storagePorts: ports,
                    hostModes: hostModes,
                    defaultHostMode: hostModes[0],
                    hostMode: hostModes[0],
                    hostModeOptions: results,
                    selectedHostModeOption: [999],
                    enableZoning: false,
                    enableLunUnification: false,
                    previous: function () {
                        dataModel.goBack();
                    }
                };

                enableSelectPageNextButton = true;

            });
            dataModel.checkSelectedHostModeOptions = function() {
                attachVolumeService.checkSelectedHostModeOptions(dataModel);
            };

        }

        $scope.$watch(function ($scope) {
            if ($scope.dataModel && $scope.dataModel.displayList) {
                return $scope.dataModel.displayList.map(function (item) {
                    return item.selected;
                });
            }
        }, function (newValue) {
            if (!newValue) {
                return;
            }
            var itemSelected = false;
            for (var i = 0; i < $scope.dataModel.displayList.length; ++i) {
                if ($scope.dataModel.displayList[i].selected) {
                    itemSelected = true;
                    break;
                }
            }
            $scope.dataModel.selectModel.itemSelected = itemSelected;
        }, true);

        $scope.$watch('dataModel.attachModel.selectedVolumes', function (newValue, oldValue) {
            if (!newValue || !oldValue) {
                return;
            }
            if (newValue !== oldValue) {
                var allLuns = {};
                _.forEach($scope.dataModel.attachModel.selectedVolumes, function (volume) {
                    // check if the lun number for each volume is invalid, update tooltip accordingly
                    if (!volume.lun) {
                        volume.validationTooltip = INVALID_TOOLTIP;
                    }
                    else {
                        volume.validationTooltip = VALID_TOOLTIP;
                    }

                    //check if the lun number for each volume is unique, update tooltip accordingly
                    if (!allLuns[volume.lun]) {
                        allLuns[volume.lun] = [];
                    }
                    if (volume.lun !== undefined) {
                        if (allLuns[volume.lun].length === 0 || volume.lun === null) {
                            volume.hasDuplicatedLun = false;
                            volume.validationTooltip = VALID_TOOLTIP;
                            allLuns[volume.lun].push(volume);
                        } else {
                            // if several volumes' lun numbers are all "null", should not make it invalid
                            if (volume.lun !== null) {
                                _.forEach(allLuns[volume.lun], function (v) {
                                    v.hasDuplicatedLun = true;
                                    v.validationTooltip = INVALID_TOOLTIP;
                                });
                                volume.hasDuplicatedLun = true;
                                volume.validationTooltip = INVALID_TOOLTIP;
                                allLuns[volume.lun].push(volume);
                            }
                        }
                    }
                });
            }
        },true);

        $scope.$watch('dataModel.attachModel.selectedVolumes', function (newValue, oldValue) {
            if (!newValue || !oldValue) {
                return;
            }
            if (newValue !== oldValue) {
                var submit = true;
                _.forEach($scope.dataModel.attachModel.selectedVolumes, function (volume) {
                    if (volume.validationTooltip && volume.validationTooltip === INVALID_TOOLTIP) {
                        submit = false;
                    }
                });
                $scope.canSubmit = submit;
            }
        }, true);
    });
