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
 * @name rainierApp.controller:EditIscsiPortCtrl
 * @description
 * # EditIscsiPortCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('EditIscsiPortCtrl', function (
        $scope,
        $routeParams,
        storagePortsService,
        storageSystemCapabilitiesService,
        orchestratorService
    ) {
        var back = function () {
            window.history.back();
        };

        var model = function (port) {
            var portIpv4 = port.iscsiPortInformation && port.iscsiPortInformation.ipv4Information ?
                port.iscsiPortInformation.ipv4Information : {};
            var portIpv6 = port.iscsiPortInformation && port.iscsiPortInformation.ipv6Information ?
                port.iscsiPortInformation.ipv6Information : {};

            return {
                storagePortId: port.storagePortId,
                storageSystemId: port.storageSystemId,
                securitySwitchEnabled: port.securitySwitchEnabled,
                attribute: port.attributes.length ? storagePortsService.rawToDisplayAttributes[port.attributes[0]] : undefined,
                ipv6Enabled: port.iscsiPortInformation ? port.iscsiPortInformation.ipv6Enabled : false,
                ipv4: {
                    address: portIpv4.address,
                    subnetMask: portIpv4.subnetMask,
                    defaultGateway: portIpv4.defaultGateway
                },
                ipv6: {
                    linklocalManual: portIpv6.linklocalAddressingMode === storagePortsService.addressingMode.manual,
                    linklocalAddress: portIpv6.linklocalAddress,
                    globalManual: portIpv6.globalAddressingMode === storagePortsService.addressingMode.manual,
                    globalAddress: portIpv6.globalAddress,
                    defaultGateway: portIpv6.defaultGateway
                }
            };
        };

        var validateAddressingMode = function (model) {
            var ipv6 = model.ipv6;

            if (!model.ipv6Enabled) {
                return true;
            }

            if (ipv6.linklocalManual && _.isEmpty(ipv6.linklocalAddress)) {
                return false;
            }

            if (ipv6.globalManual && _.isEmpty(ipv6.globalAddress)) {
                return false;
            }

            return true;
        };

        var validateIpv4Address = function (model) {
            return !_.isUndefined(model.ipv4) && !_.isEmpty(model.ipv4.address);
        };

        var generatePayload = function (model) {
            var payload = {
                securitySwitchEnabled: model.securitySwitchEnabled,
                attribute: model.supportPortAttribute ? storagePortsService.getRawPortAttribute(model.attribute) : undefined,
                iscsiPortInformation: {
                    ipv6Enabled: model.ipv6Enabled,
                    ipv4Information: {
                        address: model.ipv4.address,
                        subnetMask: model.ipv4.subnetMask,
                        defaultGateway: model.ipv4.defaultGateway
                    }
                }
            };
            if (payload.iscsiPortInformation.ipv6Enabled) {
                payload.iscsiPortInformation.ipv6Information = {
                    linklocalAddressingMode: model.ipv6.linklocalManual ? storagePortsService.addressingMode.manual : storagePortsService.addressingMode.auto,
                    globalAddressingMode: model.ipv6.globalManual ? storagePortsService.addressingMode.manual : storagePortsService.addressingMode.auto,
                    defaultGateway: model.ipv6.defaultGateway
                };
                if (model.ipv6.linklocalManual) {
                    payload.iscsiPortInformation.ipv6Information.linklocalAddress = model.ipv6.linklocalAddress;
                }
                if (model.ipv6.globalManual) {
                    payload.iscsiPortInformation.ipv6Information.globalAddress = model.ipv6.globalAddress;
                }
            }
            return payload;
        };

        var submit = function (model) {
            var payload = generatePayload(model);
            orchestratorService.updateStoragePort(model.storageSystemId, model.storagePortId, payload).then(back);
        };

        var generateDataModel = function (storagePort) {
            return {
                port: storagePort,
                updateModel: {
                    submit: function () {
                        submit($scope.dataModel.model);
                    },
                    canSubmit: function () {
                        var before = generatePayload($scope.dataModel.before);
                        var after = generatePayload($scope.dataModel.model);
                        return !_.isEqual(before, after) &&
                            validateAddressingMode($scope.dataModel.model) &&
                            validateIpv4Address($scope.dataModel.model);
                    }
                },
                portAttributeOptions: _.values(storagePortsService.portAttributes),
                model: model(storagePort),
                before: model(storagePort)
            };
        };

        var storageSystemId = $routeParams.storageSystemId;
        var portId = $routeParams.storagePortId;

        orchestratorService.storagePort(storageSystemId, portId).then(function (storagePort) {
            $scope.dataModel = generateDataModel(storagePort);
            return orchestratorService.storageSystem(storageSystemId);
        }).then(function (storageSystem) {
            $scope.dataModel.supportPortAttribute =
                storageSystemCapabilitiesService.supportPortAttribute(storageSystem.model);
            if (_.isUndefined(storageSystem) || _.isUndefined($scope.dataModel.port)) {
                back();
            }
            if ($scope.dataModel.port.type === 'FIBRE') {
                back();
            }
        });
    });
