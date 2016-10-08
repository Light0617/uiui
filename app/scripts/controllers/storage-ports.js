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
                                              queryService, wwnService, hwAlertService, storageNavigatorSessionService,constantService) {
        var storageSystemId = $routeParams.storageSystemId;
        var getStoragePortsPath = 'storage-ports';

        var typeNames = [ { name: 'FIBRE', caption: 'Fibre' },
            { name: 'ENAS', caption: 'Enas' },
            { name: 'ESCON', caption: 'ESCON' },
            { name: 'FCOE', caption: 'FCoE' },
            { name: 'FICON', caption: 'FICON' },
            { name: 'ISCSI', caption: 'iSCSI' },
            { name: 'SCSI', caption: 'SCSI' }];

        var portAttributes = {target: 'Target',
            rcuTarget: 'RCU Target',
            initiator: 'Initiator',
            external: 'External'};

        var sn2Action = storageNavigatorSessionService.getNavigatorSessionAction(storageSystemId, constantService.sessionScope.PORTS);
        sn2Action.icon = 'icon-storage-navigator-settings';
        sn2Action.tooltip = 'tooltip-configure-storage-ports';
        sn2Action.enabled = function () {
            return true;
        };

        var actions = {
            'SN2': sn2Action
        };

        $scope.summaryModel={
            getActions: function () {
                return _.map(actions);
            }
        };
        orchestratorService.storageSystem(storageSystemId).then(function (result) {
            $scope.storageSystemModel = result.model;
            return paginationService.get(null, getStoragePortsPath, objectTransformService.transformPort, true, storageSystemId);
        }).then(function (result) {
            var summaryModel = objectTransformService.transformToPortSummary(result.resources, typeNames);
            summaryModel.title = synchronousTranslateService.translate('common-storage-system-ports');
            summaryModel.hwAlert = hwAlertService;
            summaryModel.getActions = $scope.summaryModel.getActions;
            $scope.summaryModel = summaryModel;
            $scope.summaryModel.hwAlert.update();

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
                            paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function (result) {
                                updateResultTotalCounts(result);
                            });
                        });
                    }
                },
                showPortAttributeFilter: constantService.isR800Series($scope.storageSystemModel),
                chartData: summaryModel.chartData
            };

            $scope.filterModel = {
                filter: {
                    freeText: '',
                    portSpeed: '',
                    securitySwitchEnabled: null,
                    attributes: ''
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
                            value : function () {
                              if (constantService.isR800Series($scope.storageSystemModel)) {
                                  return portAttributes.target;
                              } else {
                                  return null;
                              }
                            },
                        },
                        itemAttributes: [portAttributes.target, portAttributes.initiator, portAttributes.rcuTarget, portAttributes.external]
                    },
                    enabled: function () {
                        return dataModel.anySelected();
                    },
                    confirmClick: function () {
                        $('#' + this.dialogSettings.id).modal('hide');
                        var enabled = this.dialogSettings.switchEnabled.value;
                        var attribute = null;

                        if (constantService.isR800Series($scope.storageSystemModel)) {
                            if (this.dialogSettings.itemAttribute.value === portAttributes.target) {
                                attribute = 'TARGET_PORT';
                            } else if (this.dialogSettings.itemAttribute.value === portAttributes.initiator) {
                                attribute = 'MCU_INITIATOR_PORT';
                            } else if (this.dialogSettings.itemAttribute.value === portAttributes.rcuTarget) {
                                attribute = 'RCU_TARGET_PORT';
                            } else if (this.dialogSettings.itemAttribute.value === portAttributes.external) {
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
                        this.dialogSettings.itemAttribute.value = function () {
                            if (constantService.isR800Series($scope.storageSystemModel)) {
                                return portAttributes.target; 
                            } else {
                                return null;
                            }
                        };
                    },
                    onClick: function () {

                        var firstItem = _.first(dataModel.getSelectedItems());

                        var isAllSameSecuritySwitchEnabled = _.all(dataModel.getSelectedItems(), function (storagePort) {
                            return storagePort.securitySwitchEnabled === this.securitySwitchEnabled;
                        }, firstItem);

                        this.dialogSettings.switchEnabled.value = isAllSameSecuritySwitchEnabled ? firstItem.securitySwitchEnabled : false;

                        if (constantService.isR800Series($scope.storageSystemModel)) {
                            var isAllSameAttribute = _.all(dataModel.getSelectedItems(), function (storagePort) {
                                return storagePort.attributes[0] === this.attributes[0];
                            }, firstItem);

                            this.dialogSettings.itemAttribute.value = isAllSameAttribute ? firstItem.attributes[0] : portAttributes.target;
                        }
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
                },
                {
                    title: 'VSM Port',
                    sizeClass: 'twelfth',
                    sortField: 'isVsmPort',
                    getDisplayValue: function (item) {
                        return item.isVsmPort ? 'Yes' : 'No';
                    }
                }
            ];
            if (constantService.isR800Series($scope.storageSystemModel)){
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
