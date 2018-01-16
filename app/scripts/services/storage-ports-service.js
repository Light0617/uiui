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

        var summaryActions = [];

        function init() {
            initSummaryActions();
        }

        function initSummaryActions() {
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
        }

        function storageSystemId() {
            return $routeParams.storageSystemId;
        }

        function commonGridSettings(specificSettings, model) {
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
        }

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
                    sortField: 'iscsiInformation.portIscsiName',
                    getDisplayValue: function (item) {
                        if (_.isEmpty(item.iscsiInformation) || _.isEmpty(item.iscsiInformation.portIscsiName)) {
                            return '';
                        }
                        return item.iscsiInformation.portIscsiName;
                    }
                },
                {
                    title: 'storage-port-iscsi-ipv4',
                    sizeClass: 'twelfth',
                    sortField: 'iscsiInformation.ipv4Information.address',
                    getDisplayValue: function (item) {
                        if (
                            _.isEmpty(item.iscsiInformation) ||
                            _.isEmpty(item.iscsiInformation.ipv4Information) ||
                            _.isEmpty(item.iscsiInformation.ipv4Information.address)
                        ) {
                            return '';
                        }
                        return item.iscsiInformation.ipv4Information.address;
                    }
                },
                {
                    title: 'storage-port-iscsi-ipv6',
                    sizeClass: 'twelfth',
                    sortField: 'iscsiInformaiton.ipv6Informaiton.linkLocalAddress',
                    getDisplayValue: function(item) {
                        if(
                            _.isEmpty(item.iscsiInformation) ||
                            _.isEmpty(item.iscsiInformation.ipv6Information) ||
                            _.isEmpty(item.iscsiInformation.ipv6Information.linklocalAddress) ||
                            _.isEmpty(item.iscsiInformation.ipv6Information.globalAddress)
                        ) {
                            return '';
                        }
                        return [
                            item.iscsiInformation.ipv6Information.linklocalAddress,
                            ' / ',
                            item.iscsiInformation.ipv6Information.globalAddress
                        ].join('');
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

        init();

        return {
            portAttributes: portAttributes,
            initSummary: initSummary,
            storageSystemModel: storageSystemModel,
            iscsiGridSettings: iscsiGridSettings,
            fibreGridSettings: fibreGridSettings,
            getStoragePortsPath: getStoragePortsPath,
            idKey: 'storagePortId'
        };
    });
