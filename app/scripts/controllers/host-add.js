'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:HostAddCtrl
 * @description
 * # HostAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('HostAddCtrl', function ($scope, $filter, orchestratorService, $timeout, wwnService) {

        var osTypes = orchestratorService.osType();
        var pageSize = 25;
        var dataModel = {
            hostsModel: {
                hosts: [], // All the hosts
                displayHosts: [], // Paginated hosts
                addHost: function (hosts, h, insertIndex) {
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
                    host.delete = function (hostIndex) {
                        $timeout(function () {
                            self.hosts.splice(hostIndex, 1);
                            self.displayHosts.splice(hostIndex, 1);
                        });
                    };

                    hosts.splice(insertIndex, 0, host);
                }
            },
            osTypes: osTypes
        };

        dataModel.addNewHost = function() {
            dataModel.hostsModel.addHost(dataModel.hostsModel.hosts, 0);
            dataModel.hostsModel.addHost(dataModel.hostsModel.displayHosts, 0);
        };
        dataModel.addNewHost();

        dataModel.canSubmit = function () {
            if (dataModel.busy === true){
                return dataModel.currentCanSubmit;
            }
            var iHost;
            var cHosts = dataModel.hostsModel.displayHosts.length;
            var h;
            if (cHosts <= 1) {
                dataModel.currentCanSubmit = false;
                return false;
            }
            // Skip the first row when validating the submit button
            for (iHost = 1; iHost < cHosts; ++iHost) {
                h = dataModel.hostsModel.displayHosts[iHost];
                if( !h.isValid()){
                    dataModel.currentCanSubmit = false;
                    return false;
                }
            }

            dataModel.currentCanSubmit = true;
            return true;
        };
        dataModel.busy = false;
        dataModel.currentCanSubmit = false;

        dataModel.submit = function () {
            var hostsPayload = {
                servers: []
            };
            var iHost;
            var hosts = [];
            // Skip the first row. Otherwise, we need to always fill some values in it.
            for (iHost = 1; iHost < dataModel.hostsModel.displayHosts.length; ++iHost) {
                var h = dataModel.hostsModel.displayHosts[iHost];
                hosts.push(h);
            }

            if (dataModel.hostsModel.hosts.length > dataModel.hostsModel.displayHosts.length){
                _.chain(dataModel.hostsModel.hosts)
                    .rest(dataModel.hostsModel.displayHosts.length)
                    .forEach(function (item) {
                        hosts.push(item);
                    });
            }

            _.forEach (hosts, function(h) {
                hostsPayload.servers.push(buildPayload(h.name, h.description, h.ipAddress, h.osType, h.wwns));
            });

            orchestratorService.createServers(hostsPayload).then(function () {
                window.history.back();
            });
        };

        dataModel.reset = function () {
            dataModel.hostsModel.hosts = [];
            dataModel.hostsModel.displayHosts = [];

            dataModel.addNewHost();
        };

        function buildPayload(name, description, ipAddress, osType, wwns) {
            var wwnList = [];
            _.forEach(wwns.split(','), function (w) {
                w = w.trim();
                w = wwnService.removeSymbol(w);
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

        dataModel.loadMore = function () {
            _.chain(dataModel.hostsModel.hosts)
                .rest(dataModel.hostsModel.displayHosts.length)
                .first(pageSize)
                .forEach(function (item) {
                    dataModel.hostsModel.displayHosts.push(item);
                });

            dataModel.busy = true;

            // The ultimate fix should be to defind a callback function where busy is set to false. The callback
            // function is called after the newly added servers are rendered in this page. Because we can't afford to
            // investigate how to do that in Aura release, we just add a timeout of 1 second to render the servers.
            $timeout(function () {
                $scope.dataModel.busy = false;
            }, 1000);
        };

        $scope.$watch('dataModel.importedHosts', function (hosts) {
            if (!hosts) {
                return;
            }
            if (hosts.length > 0) {
                dataModel.reset();
            }

            for(var iHost = 0; iHost < hosts.length; iHost++) {
                var h = hosts[iHost];
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
                if (hasAnyProperties && !_.isEmpty(mappedHost.name)) {
                    dataModel.hostsModel.addHost(dataModel.hostsModel.hosts, mappedHost, dataModel.hostsModel.hosts.length);
                    if (iHost < pageSize){
                        dataModel.hostsModel.addHost(dataModel.hostsModel.displayHosts, mappedHost, dataModel.hostsModel.displayHosts.length);
                    }
                }

            }

        });

        $scope.dataModel = dataModel;
    });
