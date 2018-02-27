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
        orchestratorService,
        storageNavigatorSessionService,
        synchronousTranslateService,
        objectTransformService,
        paginationService,
        wwnService,
        constantService,
        storageSystemCapabilitiesService
    ) {
        var getStoragePortsPath = 'storage-ports';

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
            idKey: 'storagePortId'
        };
    });
