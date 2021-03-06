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
        storageNavigatorLaunchActionService,
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
            { name: 'FIBRE', caption: 'Fibre' },
            { name: 'ISCSI', caption: 'iSCSI' }
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

        var initSummaryActions = function (storageSystem) {
            var launchSn2Action = storageNavigatorLaunchActionService.createNavigatorLaunchAction(
                storageSystem,
                constantService.sessionScope.PORTS,
                'icon-storage-navigator-settings',
                'tooltip-configure-storage-ports');

            summaryActions = function () {
                return _.map(launchSn2Action);
            };
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

        var initSummary = function (hwAlertService, storageSystem) {
            initSummaryActions(storageSystem);

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
                },
                discoverExternalStoragesAction(dataModel)
            ];
        };

        var discoverExternalStoragesAction = function (dataModel) {
            return {
                icon: 'icon-view',
                type: 'confirm',
                tooltip: 'action-tooltip-discover-external-storages',
                confirmTitle: 'discover-external-storages-confirmation',
                confirmMessage: 'discover-external-storages-selected-content',
                enabled: function () {
                    if (!dataModel.anySelected()) {
                        return false;
                    }

                    var isExternalPort = function (port) {
                        return _.contains(port.attributes, 'External');
                    };
                    return _.chain(dataModel.getSelectedItems()).every(isExternalPort).value();
                },
                onClick: function () {
                    var storagePortIds = _.map(dataModel.getSelectedItems(), function(port) { return port.storagePortId; });
                    var storageSystemId = dataModel.getSelectedItems()[0].storageSystemId;
                    var payload = {storagePortIds: storagePortIds};
                    orchestratorService.discoverExternalDevices(storageSystemId, payload);
                }
            };
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

        var updateResultTotalCountsFn = function (dataModel) {
            return function (result) {
                dataModel.nextToken = result.nextToken;
                dataModel.cachedList = result.resources;
                dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                dataModel.itemCounts = {
                    filtered: dataModel.displayList.length,
                    total: dataModel.total
                };
            };
        };

        var generateSetSortFn = function (dataModel) {
            return function (f) {
                $timeout(function () {
                    if (dataModel.sort.field === f) {
                        queryService.setSort(f, !dataModel.sort.reverse);
                        dataModel.sort.reverse = true;
                    } else {
                        dataModel.sort.field = f;
                        queryService.setSort(f, false);
                        dataModel.sort.reverse = false;
                    }
                    paginationService.getQuery(
                        getStoragePortsPath, objectTransformService.transformPort, storageSystemId()
                    ).then(function (result) {
                        dataModel.updateResultTotalCounts(result);
                    });
                });
            };
        };

        var generateDataModel = function (result) {
            var dataModel = {
                view: 'tile',
                nextToken: result.nextToken,
                total: result.total,
                currentPageCount: 0,
                sort: {
                    field: idKey,
                    reverse: true,
                }
            };
            dataModel.sort.setSort = generateSetSortFn(dataModel);
            return dataModel;
        };

        var generateFilterModel = function (dataModel) {
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
                    return paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId()).then(function (result) {
                        dataModel.updateResultTotalCounts(result);
                        return true;
                    });
                },
                sliderQuery: function (key, start, end, unit) {
                    paginationService.setSliderSearch(key, start, end, unit);
                    paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId()).then(function (result) {
                        dataModel.updateResultTotalCounts(result);
                    });
                },
                searchQuery: function (value) {
                    var queryObjects = [];
                    queryObjects.push(new paginationService.QueryObject(idKey, new paginationService.SearchType().STRING, value));
                    paginationService.setTextSearch(queryObjects);
                    return paginationService.getQuery(getStoragePortsPath, objectTransformService.transformPort, storageSystemId()).then(function (result) {
                        dataModel.updateResultTotalCounts(result);
                        return true;
                    });
                }
            };
        };

        var initDataModel = function (storageSystemId, protocol) {
            var queryObject = new paginationService.QueryObject('type', undefined, protocol);
            return paginationService
                .get(
                    null, getStoragePortsPath, objectTransformService.transformPort,
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
                    dataModel.cachedList = result.resources;
                    dataModel.displayList = result.resources.slice(0, scrollDataSourceBuilderServiceNew.showedPageSize);
                    dataModel.nextToken = result.nextToken;
                    return {
                        dataModel: dataModel,
                        ports: result.resources
                    };
                });
        };

        var initFibreDataModel = function (storageSystemId) {
            return initDataModel(storageSystemId, 'FIBRE');
        };

        var initIscsiDataModel = function (storageSystemId) {
            return initDataModel(storageSystemId, 'ISCSI');
        };

        return {
            portAttributes: portAttributes,
            addressingMode: addressingMode,
            rawToDisplayAttributes: rawToDisplayAttributes,
            getStoragePortsPath: getStoragePortsPath,
            idKey: 'storagePortId',
            initSummary: initSummary,
            storageSystemModel: storageSystemModel,
            iscsiGridSettings: iscsiGridSettings,
            fibreGridSettings: fibreGridSettings,
            getRawPortAttribute: getRawPortAttribute,
            iscsiActions: iscsiActions,
            discoverExternalStoragesAction: discoverExternalStoragesAction,
            generateDataModel: generateDataModel,
            generateFilterModel: generateFilterModel,
            updateResultTotalCountsFn: updateResultTotalCountsFn,
            generateSetSortFn: generateSetSortFn,
            initDataModel: initDataModel,
            initFibreDataModel: initFibreDataModel,
            initIscsiDataModel: initIscsiDataModel
        };
    });
