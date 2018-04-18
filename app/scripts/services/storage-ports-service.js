/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2018. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc service
 * @name rainierApp.storagePortsService
 * @description
 * # storagePortsService
 * Provider in the rainierApp.
 */
angular.module('rainierApp')
    .factory('storagePortsService', function (
        $location,
        $routeParams,
        $timeout,
        orchestratorService,
        storageNavigatorSessionService,
        synchronousTranslateService,
        objectTransformService,
        paginationService,
        wwnService,
        constantService,
        queryService,
        storageSystemCapabilitiesService,
        scrollDataSourceBuilderServiceNew
    ) {
        var getStoragePortsPath = 'storage-ports';
        var idKey = 'storagePortId';


        var typeNames = [
            {name: 'FIBRE', caption: 'Fibre'},
            {name: 'ISCSI', caption: 'iSCSI'}
        ];

        var portAttributes = {
            target: 'Target',
            rcuTarget: 'RCU Target',
            initiator: 'Initiator',
            external: 'External'
        };

        var rawToDisplayAttributes = {
            'TARGET_PORT': portAttributes.target,
            'MCU_INITIATOR_PORT': portAttributes.initiator,
            'RCU_TARGET_PORT': portAttributes.rcuTarget,
            'EXTERNAL_INITIATOR_PORT': portAttributes.external
        };

        var addressingMode = {
            auto: 'AUTO',
            manual: 'MANUAL'
        };

        var summaryActions = [];

        var storageSystemId = function () {
            return $routeParams.storageSystemId;
        };

        var initSummaryActions = function () {
            var sn2Action = storageNavigatorSessionService
                .getNavigatorSessionAction(storageSystemId(), constantService.sessionScope.PORTS);
            sn2Action.icon = 'icon-storage-navigator-settings';
            sn2Action.tooltip = 'tooltip-configure-storage-ports';
            sn2Action.enabled = function () {
                return true;
            };
            summaryActions = function () {
                return _.map({
                    'SN2': sn2Action
                });
            };
        };

        var init = function () {
            initSummaryActions();
        };

        var commonGridSettings = function (specificSettings, model) {
            var result = _.union(
                [
                    {
                        title: 'id',
                        sizeClass: 'twelfth',
                        sortField: 'storagePortId',
                        getDisplayValue: function (item) {
                            return item.storagePortId;
                        },
                        type: 'id'
                    }
                ],
                specificSettings,
                [
                    {
                        title: 'storage-port-security',
                        sizeClass: 'twelfth',
                        sortField: 'securitySwitchEnabled',
                        getDisplayValue: function (item) {
                            return item.securitySwitchEnabled ? 'Enabled' : 'Disabled';
                        }
                    },
                    {
                        title: 'storage-port-vsm',
                        sizeClass: 'twelfth',
                        sortField: 'isVsmPort',
                        getDisplayValue: function (item) {
                            return item.isVsmPort ? 'Yes' : 'No';
                        }
                    }
                ]
            );
            if (storageSystemCapabilitiesService.supportPortAttribute(model)) {
                result.push({
                    title: 'storage-port-attribute',
                    sizeClass: 'sixth',
                    sortField: 'attribute',
                    getDisplayValue: function (item) {
                        return item.attributes[0];
                    }

                });
            }
            return result;
        };

        var initSummary = function (hwAlertService) {
            return paginationService
                .get(null, getStoragePortsPath, objectTransformService.transformPort, true, storageSystemId())
                .then(function (result) {
                    var model = objectTransformService.transformToPortSummary(result.resources, typeNames);
                    model.title = synchronousTranslateService.translate('common-storage-system-ports');
                    model.hwAlert = hwAlertService;
                    model.hwAlert.update();
                    model.getActions = summaryActions;
                    return model;
                });
        };

        var storageSystemModel = function () {
            return orchestratorService
                .storageSystem(storageSystemId())
                .then(function (result) {
                    return result.model;
                });
        };

        var iscsiGridSettings = function (model) {
            return commonGridSettings([
                {
                    title: 'storage-port-iscsi-name',
                    sizeClass: 'twelfth',
                    sortField: 'iscsiPortInformation.portIscsiName',
                    getDisplayValue: function (item) {
                        if (_.isEmpty(item.iscsiPortInformation) || _.isEmpty(item.iscsiPortInformation.portIscsiName)) {
                            return '';
                        }
                        return item.iscsiPortInformation.portIscsiName;
                    },
                    type: 'scrollable'
                },
                {
                    title: 'storage-port-iscsi-ipv4',
                    sizeClass: 'twelfth',
                    sortField: 'iscsiPortInformation.ipv4Information.address',
                    getDisplayValue: function (item) {
                        if (
                            _.isEmpty(item.iscsiPortInformation) ||
                            _.isEmpty(item.iscsiPortInformation.ipv4Information) ||
                            _.isEmpty(item.iscsiPortInformation.ipv4Information.address)
                        ) {
                            return '';
                        }
                        return item.iscsiPortInformation.ipv4Information.address;
                    }
                },
                {
                    title: ['storage-port-iscsi-ipv6-global', 'storage-port-iscsi-ipv6-local'],
                    sizeClass: 'twelfth',
                    sortField: 'iscsiPortInformation.ipv6Information.globalAddress',
                    type: 'array',
                    getDisplayValue: function (item) {
                        if (
                            _.isEmpty(item.iscsiPortInformation) ||
                            _.isEmpty(item.iscsiPortInformation.ipv6Information) ||
                            _.isEmpty(item.iscsiPortInformation.ipv6Information.linklocalAddress) ||
                            _.isEmpty(item.iscsiPortInformation.ipv6Information.globalAddress)
                        ) {
                            return '';
                        }
                        return [
                            item.iscsiPortInformation.ipv6Information.globalAddress,
                            item.iscsiPortInformation.ipv6Information.linklocalAddress
                        ];
                    }
                }
            ], model);
        };

        var fibreGridSettings = function (model) {
            return commonGridSettings([
                {
                    title: 'WWN',
                    sizeClass: 'sixth',
                    sortField: 'wwn',
                    getDisplayValue: function (item) {
                        return item.type === 'FIBRE' ? wwnService.appendColon(item.wwn) : '';
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

                }
            ], model);
        };

        var iscsiActions = function (dataModel) {
            return [
                {
                    icon: 'icon-edit',
                    tooltip: 'edit-iscsi-port',
                    type: 'link',
                    enabled: function () {
                        return dataModel.getSelectedItems().length === 1;
                    },
                    onClick: function () {
                        var item = _.first(dataModel.getSelectedItems());
                        $location.path([
                            'storage-systems', item.storageSystemId, 'storage-ports',
                            item.storagePortId, 'edit-iscsi-port'
                        ].join('/'));
                    }
                }
            ];
        };

        var getRawPortAttribute = function (displayPortAttribute) {
            if (displayPortAttribute === portAttributes.target) {
                return 'TARGET_PORT';
            } else if (displayPortAttribute === portAttributes.initiator) {
                return 'MCU_INITIATOR_PORT';
            } else if (displayPortAttribute === portAttributes.rcuTarget) {
                return 'RCU_TARGET_PORT';
            } else if (displayPortAttribute === portAttributes.external) {
                return 'EXTERNAL_INITIATOR_PORT';
            }
            return undefined;
        };

        // select port page

        var defaultSort = function (model) {
            model.sort.setSort(idKey);
        };

        var updateResultTotalCounts = function (result, scope) {
            scope.dataModel.nextToken = result.nextToken;
            scope.dataModel.cachedList = result.resources;
            scope.dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
            scope.dataModel.itemCounts = {
                filtered: scope.dataModel.displayList.length,
                total: scope.dataModel.total
            };
        };

        var generateSetSortFn = function(scope) {
            return function (f) {
                $timeout(function () {
                    if (scope.dataModel.sort.field === f) {
                        queryService.setSort(f, !scope.dataModel.sort.reverse);
                        scope.dataModel.sort.reverse = true;
                    } else {
                        scope.dataModel.sort.field = f;
                        queryService.setSort(f, false);
                        scope.dataModel.sort.reverse = false;
                    }
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId()).then(function (result) {
                        updateResultTotalCounts(result, scope);
                    });
                });
            };
        };

        var generateDataModel = function(result, scope) {
            var dataModel = {
                view: 'tile',
                nextToken: result.nextToken,
                total: result.total,
                currentPageCount: 0,
                sort: {
                    field: idKey,
                    reverse: true,
                    setSort: generateSetSortFn(scope)
                },
                showPortAttributeFilter: storageSystemCapabilitiesService.supportPortAttribute(scope.storageSystemModel),
                chartData: scope.summaryModel ? null : scope.summaryModel.chartData
            };
            angular.extend(scope.dataModel, dataModel);
            return scope.dataModel;
        };


        var generateFilterModel = function() {
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
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId()).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                },
                sliderQuery: function (key, start, end, unit) {
                    paginationService.setSliderSearch(key, start, end, unit);
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId()).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject(idKey, new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId()).then(function (result) {
                        updateResultTotalCounts(result);
                    });
                }
            };
        };

        var generateEditFibrePortDialogSettings = function(scope) {
            var dialogSettings = {
                id: 'securityEnableDisableConfirmation',
                dialogTitle: 'edit-fibre-port-title',
                content: 'edit-fibre-port-content',
                trueText: 'storage-port-enable-security',
                falseText: 'storage-port-not-enable-security',
                switchEnabled: {
                    value: false
                }
            };

            if (
                scope.storageSystemModel &&
                storageSystemCapabilitiesService.supportPortAttribute(scope.storageSystemModel)
            ) {
                dialogSettings.itemAttribute = {
                    value: function () {
                        if (storageSystemCapabilitiesService.supportPortAttribute(scope.storageSystemModel)) {
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
        };

        var fibreActions = function(dataModel, scope) {
            return {
                icon: 'icon-edit',
                type: 'confirmation-modal',
                tooltip: 'action-tooltip-edit-fibre-port',
                dialogSettings: generateEditFibrePortDialogSettings(scope),
                enabled: function () {
                    return dataModel.anySelected();
                },
                confirmClick: function () {
                    $('#' + this.dialogSettings.id).modal('hide');
                    var enabled = this.dialogSettings.switchEnabled.value;
                    var attribute = null;

                    if (storageSystemCapabilitiesService.supportPortAttribute(scope.storageSystemModel)) {
                        attribute = getRawPortAttribute(this.dialogSettings.itemAttribute.value);
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
                        if (storageSystemCapabilitiesService.supportPortAttribute(scope.storageSystemModel)) {
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

                    if (storageSystemCapabilitiesService.supportPortAttribute(scope.storageSystemModel)) {
                        var isAllSameAttribute = _.all(dataModel.getSelectedItems(), function (storagePort) {
                            return storagePort.attributes[0] === this.attributes[0];
                        }, firstItem);

                        this.dialogSettings.itemAttribute.value = isAllSameAttribute ? firstItem.attributes[0] : portAttributes.target;
                    }
                }
            };
        };

        var initPorts = function(type, scope) {
            var queryObject = new paginationService.QueryObject('type', undefined, type);
            return paginationService
                .get(
                    null, getStoragePortsPath, objectTransformService.transformPort,
                    true, storageSystemId(), undefined, undefined, queryObject
                )
                .then(function (result) {
                    var dataModel = generateDataModel(result, scope);
                    dataModel.getResources = function () {
                        return paginationService.get(
                            null, getStoragePortsPath, objectTransformService.transformPort,
                            false, storageSystemId(), undefined, undefined, queryObject
                        );
                    };
                    if(type === 'FIBRE') {
                        dataModel.gridSettings = fibreGridSettings(scope.storageSystemModel);
                    }else if(type === 'ISCSI'){
                        dataModel.gridSettings = iscsiGridSettings(scope.storageSystemModel);
                    }
                    dataModel.cachedList = result.resources;
                    dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);

                    angular.extend(scope.dataModel, dataModel);
                    scope.filterModel = generateFilterModel();
                    scrollDataSourceBuilderServiceNew.setupDataLoader(scope, result.resources, 'storagePortSearch', true);
                    return dataModel;
                });
        };

        init();

        return {
            portAttributes: portAttributes,
            addressingMode: addressingMode,
            rawToDisplayAttributes: rawToDisplayAttributes,
            initSummary: initSummary,
            storageSystemModel: storageSystemModel,
            iscsiGridSettings: iscsiGridSettings,
            fibreGridSettings: fibreGridSettings,
            getStoragePortsPath: getStoragePortsPath,
            getRawPortAttribute: getRawPortAttribute,
            iscsiActions: iscsiActions,
            idKey: 'storagePortId',
            defaultSort: defaultSort,
            updateResultTotalCounts: updateResultTotalCounts,
            generateSetSortFn: generateSetSortFn,
            generateDataModel: generateDataModel,
            generateFilterModel: generateFilterModel,
            generateEditFibrePortDialogSettings: generateEditFibrePortDialogSettings,
            fibreActions: fibreActions,
            initPorts: initPorts
        };
    });
