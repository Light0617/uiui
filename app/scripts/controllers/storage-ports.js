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
                                              scrollDataSourceBuilderServiceNew, ShareDataService, paginationService, queryService) {
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
            // Only support for fibre port for now
            var storagePorts = _.filter(result.resources, function(sp) {
                return sp.type === 'FIBRE';
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
                displayList: result.resources,
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
                $scope.dataModel.displayList = result.resources;
                $scope.dataModel.itemCounts = {
                    filtered: $scope.dataModel.displayList.length,
                    total: $scope.dataModel.total
                };
            };

            var actions = [
                {
                    icon: 'icon-edit',
                    type: 'link',
                    enabled: function () {
                        return dataModel.onlyOneSelected();
                    },
                    onClick: function() {
                        $scope.updateSelected();
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
                    sizeClass: 'sixth',
                    sortField: 'storagePortId',
                    getDisplayValue: function (item) {
                        return item.storagePortId;
                    },
                    type: 'id'

                },
                {
                    title: 'Type',
                    sizeClass: 'sixth',
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
            $scope.dataModel = dataModel;
            scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storagePortSearch', true);
        });

        $scope.updateSelected = function () {
            var storagePort;
            for (var i = 0; i < $scope.dataModel.filteredList.length; ++i) {
                storagePort = $scope.dataModel.filteredList[i];
                if (storagePort.selected) {
                    ShareDataService.editStoragePort = storagePort;
                    ShareDataService.storageSystemModel = $scope.storageSystemModel;
                    $window.location.href = '#/storage-systems/' + storageSystemId + '/storage-ports/' + storagePort.storagePortId + '/update';
                }
            }
        };

    });
