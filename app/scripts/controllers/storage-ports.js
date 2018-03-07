/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:StoragePortsCtrl
 * @description
 * # StoragePortsCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('StoragePortsCtrl', function (
        $scope, $routeParams, $timeout, $window, orchestratorService,
        objectTransformService, synchronousTranslateService,
        scrollDataSourceBuilderServiceNew, ShareDataService, paginationService,
        queryService, wwnService, hwAlertService, storageNavigatorSessionService,
        storagePortsService, storageSystemCapabilitiesService
    ) {
        var storageSystemId = $routeParams.storageSystemId;
        var idKey = storagePortsService.idKey;
        var getStoragePortsPath = storagePortsService.getStoragePortsPath;
        var portAttributes = storagePortsService.portAttributes;

        var defaultSort = function (model) {
            model.sort.setSort(idKey);
        };

        function updateResultTotalCounts(result) {
            $scope.dataModel.nextToken = result.nextToken;
            $scope.dataModel.cachedList = result.resources;
            $scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            $scope.dataModel.itemCounts = {
                filtered: $scope.dataModel.displayList.length,
                total: $scope.dataModel.total
            };
        }

        function generateSetSortFn() {
            return function (f) {
                $timeout(function () {
                    if ($scope.dataModel.sort.field === f) {
                        queryService.setSort(f, !$scope.dataModel.sort.reverse);
                        $scope.dataModel.sort.reverse = true;
                    } else {
                        $scope.dataModel.sort.field = f;
                        queryService.setSort(f, false);
                        $scope.dataModel.sort.reverse = false;
                    }
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                });
            };
        }

        function generateDataModel(result) {
            var dataModel = {
                view: 'tile',
                nextToken: result.nextToken,
                total: result.total,
                currentPageCount: 0,
                sort: {
                    field: idKey,
                    reverse: true,
                    setSort: generateSetSortFn()
                },
                showPortAttributeFilter: storageSystemCapabilitiesService.supportPortAttribute($scope.storageSystemModel),
                chartData: $scope.summaryModel.chartData
            };
            return dataModel;
        }


        function generateFilterModel() {
            return {
                filter: {
                    freeText: '',
                    portSpeed: '',
                    securitySwitchEnabled: null,
                    attributes: ''
                },
                filterQuery: function (key, value, type, arrayClearKey) {
                    var queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                    paginationService.setFilterSearch(queryObject);
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                },
                sliderQuery: function (key, start, end, unit) {
                    paginationService.setSliderSearch(key, start, end, unit);
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject(idKey, new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                }
            };
        }

        function generateEditFibrePortDialogSettings() {
            var dialogSettings = {
                id: 'securityEnableDisableConfirmation',
                title: 'storage-port-enable-security-title',
                content: 'storage-port-enable-security-content',
                trueText: 'storage-port-enable-security',
                falseText: 'storage-port-not-enable-security',
                switchEnabled: {
                    value: false
                }
            };

            if (
                $scope.storageSystemModel &&
                storageSystemCapabilitiesService.supportPortAttribute($scope.storageSystemModel)
            ) {
                dialogSettings.itemAttribute = {
                    value: function () {
                        if (storageSystemCapabilitiesService.supportPortAttribute($scope.storageSystemModel)) {
                            return portAttributes.target;
                        } else {
                            return null;
                        }
                    }
                };
                dialogSettings.itemAttributes = [
                    portAttributes.target,
                    portAttributes.initiator,
                    portAttributes.rcuTarget,
                    portAttributes.external
                ];
            }

            return dialogSettings;
        }

        function generateEditFibrePortAction(dataModel) {
            return {
                icon: 'icon-edit',
                type: 'confirmation-modal',
                tooltip: 'action-tooltip-toggle-security',
                dialogSettings: generateEditFibrePortDialogSettings(),
                enabled: function () {
                    return dataModel.anySelected();
                },
                confirmClick: function () {
                    $('#' + this.dialogSettings.id).modal('hide');
                    var enabled = this.dialogSettings.switchEnabled.value;
                    var attribute = null;

                    if (storageSystemCapabilitiesService.supportPortAttribute($scope.storageSystemModel)) {
                        attribute = storagePortsService.getRawPortAttribute(this.dialogSettings.itemAttribute.value);
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
                        if (storageSystemCapabilitiesService.supportPortAttribute($scope.storageSystemModel)) {
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

                    if (storageSystemCapabilitiesService.supportPortAttribute($scope.storageSystemModel)) {
                        var isAllSameAttribute = _.all(dataModel.getSelectedItems(), function (storagePort) {
                            return storagePort.attributes[0] === this.attributes[0];
                        }, firstItem);

                        this.dialogSettings.itemAttribute.value = isAllSameAttribute ? firstItem.attributes[0] : portAttributes.target;
                    }
                }
            };
        }

        function initFibre() {
            var queryObject = new paginationService.QueryObject('type', undefined, 'FIBRE');
            return paginationService
                .get(
                    null, getStoragePortsPath, objectTransformService.transformPort,
                    true, storageSystemId, undefined, undefined, queryObject
                )
                .then(function (result) {
                    var dataModel = generateDataModel(result);
                    var editFibrePortAction = generateEditFibrePortAction(dataModel);
                    dataModel.getActions = function () {
                        return [editFibrePortAction];
                    };
                    dataModel.getResources = function () {
                        return paginationService.get(
                            null, getStoragePortsPath, objectTransformService.transformPort,
                            false, storageSystemId, undefined, undefined, queryObject
                        );
                    };
                    dataModel.gridSettings = storagePortsService.fibreGridSettings($scope.storageSystemModel);
                    dataModel.cachedList = result.resources;
                    dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                    $scope.dataModel = dataModel;
                    $scope.filterModel = generateFilterModel();
                    scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storagePortSearch', true);
                    return dataModel;
                });
        }

        function initIscsi() {
            var queryObject = new paginationService.QueryObject('type', undefined, 'ISCSI');
            return paginationService
                .get(
                    undefined, getStoragePortsPath, objectTransformService.transformPort,
                    true, storageSystemId, undefined, undefined, queryObject
                )
                .then(function (result) {
                    var dataModel = generateDataModel(result);
                    dataModel.getResources = function () {
                        return paginationService.get(
                            null, getStoragePortsPath, objectTransformService.transformPort,
                            false, storageSystemId, undefined, undefined, queryObject
                        );
                    };
                    dataModel.gridSettings = storagePortsService.iscsiGridSettings($scope.storageSystemModel);
                    dataModel.cachedList = result.resources;
                    dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                    var actions = storagePortsService.iscsiActions(dataModel);
                    dataModel.getActions = function () {
                        return actions;
                    };

                    $scope.dataModel = dataModel;
                    $scope.filterModel = generateFilterModel();
                    scrollDataSourceBuilderServiceNew.setupDataLoader($scope, result.resources, 'storagePortSearch', true);
                    return dataModel;
                });
        }

        function tabModel() {
            var tabs = ['Fibre', 'iSCSI'];
            return {
                tabs: tabs,
                selected: tabs[0],
                onChange: function (tabName) {
                    if (tabName === 'Fibre') {
                        initFibre().then(defaultSort);
                    } else if (tabName === 'iSCSI') {
                        initIscsi().then(defaultSort);
                    }
                }
            };
        }

        function select(tabName) {
            $scope.tabModel.selected = tabName;
            $scope.tabModel.onChange(tabName);
        }

        $scope.tabModel = tabModel();

        storagePortsService.storageSystemModel().then(function (result) {
            $scope.storageSystemModel = result;
            return storagePortsService.initSummary(hwAlertService);
        }).then(function (result) {
            $scope.summaryModel = result;
            var fibre = _.find(result.chartData, function (e) {
                return e.name === 'Fibre';
            });
            var iscsi = _.find(result.chartData, function (e) {
                return e.name === 'iSCSI';
            });

            var fibreCount = fibre ? fibre.value : 0;
            var iscsiCount = iscsi ? iscsi.value : 0;

            if (fibreCount >= iscsiCount) {
                select('Fibre');
                return initFibre();
            } else {
                select('iSCSI');
                return initIscsi();
            }
        }).then(defaultSort);

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
