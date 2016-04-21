'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePortsCtrl
 * @description
 * # StoragePortsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StoragePortsCtrl', function ($scope, $routeParams, $timeout, $window, orchestratorService,
                                              objectTransformService, synchronousTranslateService,
                                              scrollDataSourceBuilderServiceNew, ShareDataService, paginationService,
                                              queryService, wwnService) {
        var storageSystemId = $routeParams.storageSystemId;
        var getStoragePortsPath = 'storage-ports';

        var typeNames = [ { name: 'FIBRE', caption: 'Fibre' },
            { name: 'ENAS', caption: 'Enas' },
            { name: 'ESCON', caption: 'ESCON' },
            { name: 'FCOE', caption: 'FCoE' },
            { name: 'FICON', caption: 'FICON' },
            { name: 'ISCSI', caption: 'iSCSI' },
            { name: 'SCSI', caption: 'SCSI' }];

        function getTypeCount(storagePorts){
            return  _.countBy(storagePorts, function(storagePort){
                return storagePort.type;
            });
        }

        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            $scope.storageSystemModel= result.model;
        });

        paginationService.get(null, getStoragePortsPath, objectTransformService.transformPort, true, storageSystemId).then(function (result) {
            // Only support for fibre port and iscsi port for now
            var storagePorts = _.filter(result.resources, function(sp) {
                return sp.type === 'FIBRE' || sp.type === 'ISCSI';
            });

            angular.forEach(storagePorts, function(item) {
                if(item.topology === 'FABRIC_ON_ARB_LOOP') {
                    item.fabric = 'On';
                    item.connectionType = 'FC-AL';
                } else if(item.topology === 'FABRIC_OFF_ARB_LOOP') {
                    item.fabric = 'Off';
                    item.connectionType = 'FC-AL';
                } else if(item.topology === 'FABRIC_ON_POINT_TO_POINT') {
                    item.fabric = 'On';
                    item.connectionType = 'P-to-P';
                } else if(item.topology === 'FABRIC_OFF_POINT_TO_POINT') {
                    item.fabric = 'Off';
                    item.connectionType = 'P-to-P';
                }
                var newAttributes = [];
                angular.forEach(item.attributes, function(attribute) {
                        if(attribute === 'TARGET_PORT') {
                            newAttributes.push('Target');
                        } else if(attribute === 'MCU_INITIATOR_PORT') {
                            newAttributes.push('Initiator');
                        } else if(attribute === 'RCU_TARGET_PORT') {
                            newAttributes.push('RCU Target');
                        } else if(attribute === 'EXTERNAL_INITIATOR_PORT') {
                            newAttributes.push('External');
                        }
                    }
                );
                item.attributes = newAttributes;
            });

            var summaryModel = {chartData: []};
            var typeCount = getTypeCount(storagePorts);

            for (var i = 0; i < typeNames.length; ++i) {
                if (!typeCount[typeNames[i].name]) {
                    continue;
                }
                summaryModel.chartData.push({
                    name: synchronousTranslateService.translate(typeNames[i].name),
                    value: typeCount[typeNames[i].name]
                });
            }
            summaryModel.title = synchronousTranslateService.translate('common-storage-system-ports');

            $scope.summaryModel = summaryModel;

            var dataModel = {

                view: 'tile',
                nextToken: result.nextToken,
                total: result.total,
                currentPageCount: 0,
                sort: {
                    field: 'name',
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
                            paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function(result) {
                                updateResultTotalCounts(result);
                            });
                        });
                    }
                },
                portAttributes: ['Target', 'RCU Target', 'Initiator', 'External'],
                showPortAttributeFilter: $scope.storageSystemModel === 'VSP G1000',
                chartData: summaryModel.chartData
            };

            $scope.filterModel = {
                filter: {
                    freeText: ''
                },
                filterQuery: function (key, value, type, arrayClearKey) {
                    var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                    paginationService.setFilterSearch(queryObject);
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                sliderQuery: function(key, start, end, unit) {
                    paginationService.setSliderSearch(key, start, end, unit);
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject('storagePortId', new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function(result) {
                        updateResultTotalCounts(result);
                    });
                }
            };

            var updateResultTotalCounts = function(result) {
                $scope.dataModel.nextToken = result.nextToken;
                $scope.dataModel.cachedList = result.resources;
                $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                $scope.dataModel.itemCounts = {
                    filtered: $scope.dataModel.displayList.length,
                    total: $scope.dataModel.total
                };
            };

            var actions = [
                {
                    icon: 'icon-edit',
                    type: 'confirmation-modal',
                    tooltip: 'action-tooltip-toggle-security',
                    dialogSettings: {
                        id: 'securityEnableDisableConfirmation',
                        title: 'storage-port-enable-security-title',
                        content: 'storage-port-enable-security-content',
                        trueText: 'storage-port-enable-security',
                        falseText: 'storage-port-not-enable-security',
                        switchEnabled: {
                            value: false
                        },
                        itemAttribute: {
                            value: $scope.storageSystemModel === 'VSP G1000' ? '' : null
                        },
                        itemAttributes: ['Target','Initiator','RCU Target','External']
                    },
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    confirmClick: function () {
                        $('#' + this.dialogSettings.id).modal('hide');
                        var enabled = this.dialogSettings.switchEnabled.value;
                        var attribute = null;

                        if ($scope.storageSystemModel === 'VSP G1000') {
                            if (this.dialogSettings.itemAttribute.value === 'Target') {
                                attribute = 'TARGET_PORT';
                            } else if (this.dialogSettings.itemAttribute.value === 'Initiator') {
                                attribute = 'MCU_INITIATOR_PORT';
                            } else if (this.dialogSettings.itemAttribute.value === 'RCU Target') {
                                attribute = 'RCU_TARGET_PORT';
                            } else if (this.dialogSettings.itemAttribute.value === 'External') {
                                attribute = 'EXTERNAL_INITIATOR_PORT';
                            }
                        }

                        _.forEach(dataModel.getSelectedItems(), function (storagePort) {
                            var payload = {
                                securitySwitchEnabled: enabled,
                                attribute: attribute
                            };
                            orchestratorService.updateStoragePort(storagePort.storageSystemId, storagePort.storagePortId, payload);
                        });

                        this.dialogSettings.switchEnabled.value = false;
                        this.dialogSettings.itemAttribute.value = $scope.storageSystemModel === 'VSP G1000' ? '' : null;

                    }
                }
            ];
            dataModel.getActions = function () {
                return actions;
            };

            dataModel.getResources = function(){
                return paginationService.get(null, getStoragePortsPath, objectTransformService.transformPort, false, storageSystemId);
            };

            dataModel.gridSettings = [
                {
                    title: 'ID',
                    sizeClass: 'twelfth',
                    sortField: 'storagePortId',
                    getDisplayValue: function (item) {
                        return item.storagePortId;
                    },
                    type: 'id'

                },
                {
                    title: 'WWN',
                    sizeClass: 'sixth',
                    sortField: 'wwn',
                    getDisplayValue: function (item) {
                        return item.type === 'FIBRE' ? wwnService.appendColon(item.wwn) : '';
                    }

                },
                {
                    title: 'Type',
                    sizeClass: 'twelfth',
                    sortField: 'type',
                    getDisplayValue: function (item) {
                        return item.type;
                    }

                },
                {
                    title: 'Speed',
                    sizeClass: 'twelfth',

                    sortField: 'speed',
                    getDisplayValue: function (item) {
                        return item.speed;
                    }

                },
                {
                    title: 'Fabric',
                    sizeClass: 'twelfth',
                    sortField: 'fabric',
                    getDisplayValue: function (item) {
                        return item.fabric;
                    }

                },
                {
                    title: 'Connection Type',
                    sizeClass: 'twelfth',
                    sortField: 'connectionType',
                    getDisplayValue: function (item) {
                        return item.connectionType;
                    }

                },
                {
                    title: 'Security',
                    sizeClass: 'twelfth',
                    sortField: 'securitySwitchEnabled',
                    getDisplayValue: function (item) {
                        return item.securitySwitchEnabled ? 'Enabled' : 'Disabled';
                    }
                }
            ];
            if ($scope.storageSystemModel === 'VSP G1000'){
                dataModel.gridSettings.push({
                    title: 'Attribute',
                    sizeClass: 'sixth',
                    sortField: 'attribute',
                    getDisplayValue: function (item) {
                        return item.attributes[0];
                    }

                });
            }
            dataModel.cachedList = result.resources;
            dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

            $scope.dataModel = dataModel;
            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storagePortSearch', true);
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

    });
