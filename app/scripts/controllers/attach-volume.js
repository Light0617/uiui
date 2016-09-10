/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Data Systems, 2015. All rights reserved.
 *
 * ========================================================================
 */
'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:CreateVolumesCtrl
 * @description
 * # CreateVolumesCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('AttachVolumesCtrl', function (
        $scope,
        $modal,
        ShareDataService,
        orchestratorService,
        constantService,
        scrollDataSourceBuilderServiceNew,
        viewModelService,
        synchronousTranslateService,
        paginationService,
        queryService,
        objectTransformService,
        attachVolumeService,
        $timeout,
        $location) {


        var selectedServers = ShareDataService.pop('selectedServers') || [];
        var VALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-valid-tooltip');
        var INVALID_TOOLTIP = synchronousTranslateService.translate('storage-volume-attach-invalid-tooltip');
        var getPortsPath = 'storage-ports';
        var getVolumesPath = 'volumes';
        ShareDataService.showProvisioningStatus = true;
        $scope.canSubmit = true;
        queryService.clearQueryMap();

        if (!selectedServers || selectedServers.length === 0) {
            $location.path('hosts');
        }

        $scope.storageSystems = paginationService.getAllPromises(null, 'storage-systems', true, null, objectTransformService.transformStorageSystem).then(function (result) {
            var storageSystems = [];
            var noAvailableArray = false;
            _.forEach(result, function (storageSystem) {
                if (storageSystem.accessible) {
                    storageSystems.push(storageSystem);
                    }
                });
            var selectedStorageSystem = storageSystems[0];
            if(storageSystems.length === 0) {
                noAvailableArray = true;
            }

            var dataModel = {
                canSubmit: true,
                view: 'tile',
                selectedStorageSystem: selectedStorageSystem,
                storageSystems: storageSystems,
                storagePorts: [],
                sort: {
                    field: 'volumeId',
                    reverse: false,
                    setSort: function (f) {
                        $timeout(function () {
                            if (dataModel.sort.field === f) {
                                dataModel.sort.reverse = !dataModel.sort.reverse;
                            }
                            else {
                                dataModel.sort.field = f;
                                dataModel.sort.reverse = false;
                            }
                        });
                    }
                }

            };
            angular.extend(dataModel, viewModelService.newWizardViewModel(['select', 'attach', 'paths']));

            dataModel.selectModel = {
                noAvailableArray: noAvailableArray,
                confirmTitle: synchronousTranslateService.translate('storage-volume-attach-confirmation'),
                confirmMessage: synchronousTranslateService.translate('storage-volume-attach-zero-selected'),
                canGoNext: function () {
                    return _.some(dataModel.displayList, 'selected');
                },

                showPopUpOnAnyAttachedVolume: function () {
                    if(dataModel.selectModel.areAllSelectedVolumesUnattached()) {
                        return true;
                    } else {
                        var modelInstance = $modal.open({
                            templateUrl: 'views/templates/attach-volume-confirmation-modal.html',
                            windowClass: 'modal fade confirmation',
                            backdropClass: 'modal-backdrop',
                            controller: function ($scope) {
                                $scope.cancel = function () {
                                    modelInstance.dismiss('cancel');
                                };

                                $scope.ok = function() {
                                    $timeout(function () {
                                        dataModel.attachModel.selectedVolumes = _.where(dataModel.displayList, 'selected');
                                        _.forEach(dataModel.attachModel.selectedVolumes, function(volume) {
                                            volume.lun = null;
                                            volume.decimalNumberRegexp = /^[^.]+$/;
                                            volume.hasDuplicatedLun = false;
                                            volume.validationTooltip = VALID_TOOLTIP;
                                        });
                                    });
                                    dataModel.goNext();
                                    modelInstance.close(true);
                                };

                                modelInstance.result.finally(function() {
                                    $scope.cancel();
                                });
                            }
                        });
                    }
                },

                areAllSelectedVolumesUnattached: function() {
                    var flags = [];
                    _.forEach(dataModel.getSelectedItems(), function (item) {
                        flags.push(item.isUnattached());
                    });
                    return flags.areAllItemsTrue();
                },

                next: function () {
                    if (dataModel.selectModel.canGoNext && !dataModel.selectModel.canGoNext()) {
                        return;
                    }
                    if(!dataModel.selectModel.showPopUpOnAnyAttachedVolume()) {
                        return;
                    }
                    $timeout(function () {
                        dataModel.attachModel.selectedVolumes = _.where(dataModel.displayList, 'selected');
                        _.forEach(dataModel.attachModel.selectedVolumes, function(volume) {
                            volume.lun = null;
                            volume.decimalNumberRegexp = /^[^.]+$/;
                            volume.hasDuplicatedLun = false;
                            volume.validationTooltip = VALID_TOOLTIP;
                        });
                    });
                    dataModel.goNext();
                },
                validation: true,
                itemSelected: false
            };
            dataModel.process = function(resources){
                // Only support for fibre port for now
                resources = _.filter(resources, function(storagePort) {
                    return storagePort.type === 'FIBRE';
                });
                _.forEach(resources, function (item) {
                    item.storageSystemModel = dataModel.storageSystemModel;
                    objectTransformService.transformPort(item);
                });

                dataModel.storagePorts = resources;
            };

            $scope.dataModel = dataModel;
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

        $scope.$watch('dataModel.selectedStorageSystem', function(s) {
            if (!s) {
                return;
            }

            queryService.setSort('volumeId', false);
            paginationService.get(null, 'volumes', objectTransformService.transformVolume, false, s.storageSystemId).then(updateVolumes);
            orchestratorService.storageSystem(s.storageSystemId).then(function(result) {
                $scope.dataModel.storageSystemModel = result.model;
                paginationService.getAll(null, getPortsPath, true, s.storageSystemId, result.model, $scope.dataModel);
            });

            $scope.filterModel = {
                showAllFilters: true,
                filter: {
                    freeText: '',
                    volumeType: '',
                    replicationType: [],
                    protectionStatusList: [],
                    snapshot: false,
                    clone: false,
                    protected: false,
                    unprotected: false,
                    secondary: false,
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
                arrayType: (new paginationService.SearchType()).ARRAY,
                filterQuery: function (key, value, type, arrayClearKey) {
                    var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                    paginationService.setFilterSearch(queryObject);
                    paginationService.getQuery(getVolumesPath, objectTransformService.transformVolume, s.storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                sliderQuery: function(key, start, end, unit) {
                    paginationService.setSliderSearch(key, start, end, unit);
                    paginationService.getQuery(getVolumesPath, objectTransformService.transformVolume, s.storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('volumeId', new paginationService.SearchType().INT, value));
                    queryObjects.push(new paginationService.QueryObject('label', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(getVolumesPath, objectTransformService.transformVolume, s.storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                }
            };

        });

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
                        submit =false;
                    }
                });
                $scope.canSubmit = submit;
            }
        }, true);

        var autoSelect = 'AUTO';

        $scope.$watch('dataModel.storagePorts', function(ports) {
            if (!ports) {
                return;
            }

            var hostModes = constantService.osType();
            hostModes.splice(0, 0, autoSelect);

            var dataModel = $scope.dataModel;

            orchestratorService.storageSystemHostModeOptions($scope.dataModel.selectedStorageSystem.storageSystemId).then(function (results) {
                var wwpns = attachVolumeService.getSelectedServerWwpns(selectedServers);
                var queryString = paginationService.getQueryStringForList(wwpns);
                paginationService.clearQuery();
                queryService.setQueryMapEntry('hbaWwns', queryString);
                paginationService.getAllPromises(null, 'host-groups', false, $scope.dataModel.selectedStorageSystem.storageSystemId, null, false).then(function(hostGroupResults) {
                    var hostModeOption = attachVolumeService.getMatchedHostModeOption(hostGroupResults);
                    dataModel.attachModel = {
                        lastSelectedHostModeOption: hostModeOption,
                        subTitle: 'Selected Volumes',
                        storageSystemSelectable: false,
                        storagePools: ports,
                        selectedServers: selectedServers,
                        hostModes: hostModes,
                        hostMode : attachVolumeService.getMatchedHostMode(hostGroupResults, hostModes[0]),
                        hostModeOptions: results,
                        serverPortMapperModel: viewModelService.newServerPortMapperModel(ports, selectedServers),
                        selectedHostModeOption: hostModeOption,
                        enableZoning: false,
                        enableLunUnification: false,
                        canGoNext: function () {
                            return true;
                        },
                        next: function () {
                            if (dataModel.attachModel.canGoNext && !dataModel.attachModel.canGoNext()) {
                                return;
                            }

                            var serverIds = [];
                            _.forEach(selectedServers, function(server){
                                serverIds.push(server.serverId);
                            });
                            var selectedHostModeOptions = attachVolumeService.getSelectedHostMode(dataModel);

                            var autoPathSelectionPayload = {
                                storageSystemId: dataModel.selectedStorageSystem.storageSystemId,
                                hostMode: (dataModel.attachModel.hostMode === autoSelect) ? null : dataModel.attachModel.hostMode,
                                hostModeOptions: (!selectedHostModeOptions || selectedHostModeOptions.length === 0) ? null : selectedHostModeOptions,
                                serverIds: serverIds
                            };
                            orchestratorService.autoPathSelect(autoPathSelectionPayload).then(function(result){
                                attachVolumeService.setEditLunPage(dataModel,
                                    dataModel.selectedStorageSystem.storageSystemId,
                                    dataModel.attachModel.selectedVolumes,
                                    selectedServers,
                                    autoPathSelectionPayload.hostModeOptions,
                                    ports,
                                    result.pathResources);
                                dataModel.goNext();
                            }).finally(function(){
                                dataModel.isWaiting = false;
                            });

                            dataModel.isWaiting = true;
                        },
                        previous: function() {
                            dataModel.goBack();
                        }

                    };

                }).finally(function(){
                    paginationService.clearQuery();
                });

            });
            dataModel.checkSelectedHostModeOptions = function() {
                attachVolumeService.checkSelectedHostModeOptions(dataModel);
            };
        });

        // call to updated volume list
        function updateVolumes(result) {
            _.forEach(result.resources, function(volume) {
                volume.selected = false;
            });

            $scope.dataModel.getResources = function(){
                queryService.setSort('volumeId', false);
                return paginationService.get($scope.dataModel.nextToken, 'volumes', objectTransformService.transformVolume,
                    false, $scope.dataModel.selectedStorageSystem.storageSystemId);
            };
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.total = result.total;
            $scope.dataModel.currentPageCount = 0;
            $scope.dataModel.cachedList = result.resources;
            $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storageSystemVolumesSearch');
            $scope.dataModel.allItemsSelected = false;
        }

        Array.prototype.areAllItemsTrue = function() {
            for(var i = 0; i < this.length; i++) {
                if(this[i] === false) {
                    return false;
                }
            }
            return true;
        };
    });