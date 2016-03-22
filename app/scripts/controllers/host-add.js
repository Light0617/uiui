'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:HostAddCtrl
 * @description
 * # HostAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('HostAddCtrl', function ($scope, $filter, orchestratorService, $timeout) {

        var osTypes = orchestratorService.osType();
        var dataModel = {
            hostsModel: {
                hosts: [],
                addHost: function (h) {
                    var self = this;
                    var host = {
                        name: '',
                        description: '',
                        ipAddress: '',
                        osType: osTypes[0],
                        wwns: ''

                    };
                    angular.extend(host, h);

                    host.isValid = function () {
                        return !_.isEmpty(host.name) && !_.isEmpty(host.osType) && !_.isEmpty(host.wwns);
                    };
                    host.delete = function () {
                        $timeout(function () {
                            _.remove(self.hosts, function (h) {
                                return h === host;
                            });
                        });
                    };

                    self.hosts.splice(0, 0, host);
                }
            },
            osTypes: osTypes
        };

        dataModel.hostsModel.addHost();

        dataModel.canSubmit = function () {
            var iHost;
            var cHosts = dataModel.hostsModel.hosts.length;
            var h;
            if (cHosts <= 1) {
                return false;
            }
            // Skip the first row when validating the submit button
            for (iHost = 1; iHost < cHosts; ++iHost) {
                h = dataModel.hostsModel.hosts[iHost];
                if( !h.isValid()){
                    return false;
                }
            }

            return true;
        };

        dataModel.submit = function () {
            var hostsPayload = {
                servers: []
            };
            var iHost;
            // Skip the first row. Otherwise, we need to always fill some values in it.
            for (iHost = 1; iHost < dataModel.hostsModel.hosts.length; ++iHost) {
                var h = dataModel.hostsModel.hosts[iHost];
                hostsPayload.servers.push(buildPayload(h.name, h.description, h.ipAddress, h.osType, h.wwns));
            }

            orchestratorService.createServers(hostsPayload).then(function () {
                window.history.back();
            });
        };

        dataModel.reset = function () {
            dataModel.hostsModel.hosts = [];
            dataModel.hostsModel.addHost();
        };

        function buildPayload(name, description, ipAddress, osType, wwns) {
            var wwnList = [];
            _.forEach(wwns.split(','), function (w) {
                w = w.trim();
                wwnList.push(w);
            });

            return {
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
            wwns: 'wwns'
        };

        $scope.$watch('dataModel.importedHosts', function (hosts) {
            if (!hosts) {
                return;
            }
            if (hosts.length > 0) {
                dataModel.hostsModel.hosts = [];
            }

            _.forEach(hosts, function (h) {
                var mappedHost = {};
                var hasAnyProperties = false;
                for (var property in h) {
                    var mappedProperty = csvFieldMappings[property.toLowerCase()];
                    if (mappedProperty) {
                        if (mappedProperty === 'osType'){
                            // For osType, we need to convert it to upper case so that it can be recognized.
                            mappedHost[mappedProperty] = h[property].toUpperCase();
                        } else {
                            mappedHost[mappedProperty] = h[property];
                        }
                        hasAnyProperties = true;
                    }
                }
                if (hasAnyProperties) {
                    dataModel.hostsModel.addHost(mappedHost);
                }

            });
            if (dataModel.hostsModel.hosts.length === 0) {
                dataModel.hostsModel.addHost();
            }

        });

        $scope.dataModel = dataModel;
    });
