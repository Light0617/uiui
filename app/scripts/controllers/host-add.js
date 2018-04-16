'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:HostAddCtrl
 * @description
 * # HostAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('HostAddCtrl', function ($scope, $filter, orchestratorService, constantService, $timeout, wwnService) {

        var osTypes = constantService.osType();
        var getEmptyHost = function () {
            return {
                name: '',
                description: '',
                ipAddress: '',
                osType: osTypes[0]
            };
        };
        var dataModel = {
            hostsModel: {
                fibreHosts: [], // Paginated hosts
                iscsiHosts: [],
                addFibreHost: function (h, insertIndex) {
                    var self = this;

                    var host = getEmptyHost();
                    host.wwns = '';

                    angular.extend(host, h);

                    host.isValid = function () {
                        return !_.isEmpty(host.name) && !_.isEmpty(host.osType) && !_.isEmpty(host.wwns);
                    };
                    host.delete = function (hostIndex) {
                        $timeout(function () {
                            self.fibreHosts.splice(hostIndex, 1);
                        });
                    };
                    self.fibreHosts.splice(insertIndex, 0, host);
                },
                addIscsiHost: function (h, insertIndex) {
                    var self = this;

                    var host = getEmptyHost();
                    host.chapUser = '';
                    host.iscsiNames = '';

                    angular.extend(host, h);

                    host.isValid = function () {
                        return !_.isEmpty(host.name) && !_.isEmpty(host.osType) && !_.isEmpty(host.iscsiNames);
                    };
                    host.delete = function (hostIndex) {
                        $timeout(function () {
                            self.iscsiHosts.splice(hostIndex, 1);
                        });
                    };
                    self.iscsiHosts.splice(insertIndex, 0, host);
                }

            },
            osTypes: osTypes
        };

        dataModel.addNewFibreHost = function () {
            dataModel.hostsModel.addFibreHost({}, 0);
        };
        dataModel.addNewIscsiHost = function () {
            dataModel.hostsModel.addIscsiHost({}, 0);
        };

        dataModel.canSubmit = function () {
            var valid = function (h) {
                return h.isValid();
            };

            return dataModel.hostsModel.fibreHosts.length + dataModel.hostsModel.iscsiHosts.length > 0 &&
                _.every(dataModel.hostsModel.fibreHosts, valid) &&
                _.every(dataModel.hostsModel.iscsiHosts, valid);
        };

        dataModel.submit = function () {
            var hostsPayload = {
                servers: []
            };

            _.forEach(dataModel.hostsModel.fibreHosts, function (h) {
                hostsPayload.servers.push(buildFibrePayload(h.name, h.description, h.ipAddress, h.osType, h.wwns));
            });
            _.forEach(dataModel.hostsModel.iscsiHosts, function (h) {
                hostsPayload.servers.push(buildIscsiPayload(
                    h.name, h.description, h.ipAddress, h.osType, h.iscsiNames, h.chapUserName, h.chapUserSecret
                ));
            });

            orchestratorService.createServers(hostsPayload).then(function () {
                window.history.back();
            });
        };

        dataModel.reset = function () {
            dataModel.hostsModel.fibreHosts = [];
            dataModel.hostsModel.iscsiHosts = [];
        };

        function buildIscsiPayload(
            name, description, ipAddress, osType, iscsiNames, chapUserName, chapUserSecret
        ) {
            var chapUser = chapUserName || chapUserSecret ? {
                userName: chapUserName,
                secret: chapUserSecret
            } : undefined;
            return {
                protocol: 'ISCSI',
                serverName: name,
                description: description,
                ipAddress: ipAddress,
                osType: osType,
                iscsiNames: _.map(iscsiNames.split(','), function (n) {
                    return n.trim();
                }),
                chapUser: chapUser
            };

        }

        function buildFibrePayload(name, description, ipAddress, osType, wwns) {
            var wwnList = [];
            _.forEach(wwns.split(','), function (w) {
                w = w.trim();
                w = wwnService.removeSymbol(w);
                wwnList.push(w);
            });

            return {
                protocol: 'FIBRE',
                serverName: name,
                description: description,
                ipAddress: ipAddress,
                osType: osType,
                wwpns: wwnList
            };
        }

        var csvFieldMappings = {
            name: 'name',
            description: 'description',
            ipaddress: 'ipAddress',
            ostype: 'osType',
            wwns: 'wwns',
            iscsinames: 'iscsiNames',
            chapusername: 'chapUserName',
            chapusersecret: 'chapUserSecret'
        };

        var convertCsvToHost = function (csvRow) {
            var mappedHost = {};
            var empty = true;
            for (var property in csvRow) {
                var mappedProperty = csvFieldMappings[property.toLowerCase()];
                if (mappedProperty) {
                    empty = false;
                    if (mappedProperty === 'osType') {
                        // For osType, we need to convert it to upper case so that it can be recognized.
                        mappedHost[mappedProperty] = csvRow[property].toUpperCase();
                    } else {
                        mappedHost[mappedProperty] = csvRow[property];
                    }
                }
            }
            return empty ? undefined : mappedHost;
        };

        $scope.$watch('dataModel.importedHosts', function (hosts) {
            if (!hosts) {
                return;
            }
            if (hosts.length > 0) {
                dataModel.reset(true);
            }

            var iscsiIndex = 0;
            var fibreIndex = 0;

            _.each(hosts, function (host) {
                var converted = convertCsvToHost(host);

                if (_.isEmpty(host)) {
                    return;
                }
                if (converted.iscsiNames) {
                    dataModel.hostsModel.addIscsiHost(converted, iscsiIndex++);
                } else {
                    dataModel.hostsModel.addFibreHost(converted, fibreIndex++);
                }
            });
        });

        $scope.dataModel = dataModel;
    });
