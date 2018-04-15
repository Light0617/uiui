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
        var portAttributes = storagePortsService.portAttributes;

        var defaultSort = function (model) {
            model.sort.setSort(idKey);
        };

        function generateEditFibrePortDialogSettings () {
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

        function generateEditFibrePortAction (dataModel) {
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

        function initFibre () {
            return storagePortsService.initFibreDataModel(storageSystemId).then(function (result) {
                var dataModel = result.dataModel;
                var ports = result.ports;

                dataModel.gridSettings = storagePortsService.fibreGridSettings($scope.storageSystemModel);
                dataModel.showPortAttributeFilter = storageSystemCapabilitiesService.supportPortAttribute($scope.storageSystemModel);
                dataModel.chartData = $scope.summaryModel.chartData;
                var editFibrePortAction = generateEditFibrePortAction(dataModel);
                dataModel.getActions = function () {
                    return [editFibrePortAction];
                };
                $scope.dataModel = dataModel;
                $scope.filterModel = storagePortsService.generateFilterModel($scope.dataModel);
                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, ports, 'storagePortSearch', true);

                return $scope.dataModel;
            });
        }

        function initIscsi () {
            return storagePortsService.initIscsiDataModel(storageSystemId).then(function (result) {
                var dataModel = result.dataModel;
                var ports = result.ports;

                dataModel.gridSettings = storagePortsService.iscsiGridSettings($scope.storageSystemModel);
                dataModel.showPortAttributeFilter = storageSystemCapabilitiesService.supportPortAttribute($scope.storageSystemModel);
                dataModel.chartData = $scope.summaryModel.chartData;
                var actions = storagePortsService.iscsiActions(dataModel);
                dataModel.getActions = function () {
                    return actions;
                };
                $scope.dataModel = dataModel;
                $scope.filterModel = storagePortsService.generateFilterModel($scope.dataModel);
                scrollDataSourceBuilderServiceNew.setupDataLoader($scope, ports, 'storagePortSearch', true);

                return $scope.dataModel;
            });
        }

        function tabModel () {
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

        function select (tabName) {
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
