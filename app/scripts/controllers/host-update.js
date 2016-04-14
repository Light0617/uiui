'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:HostUpdateCtrl
 * @description
 * # HostUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('HostUpdateCtrl', function ($scope, $routeParams, orchestratorService) {
        var hostId = $routeParams.hostId;

        orchestratorService.host(hostId).then(function(result) {
            var wwns = result.displayWWNs.join(', ');

            $scope.dataModel = {
                originalHost: result,
                updatedHostName: result.serverName,
                updatedDescription: result.description,
                updatedIpAddress: result.ipAddress,
                updatedOsType: result.osType,
                updatedWwns: wwns,
                osTypes: orchestratorService.osType(),
                isValid: function () {
                    return !_.isEmpty(this.updatedHostName) && !_.isEmpty(this.updatedOsType) && !_.isEmpty(this.updatedWwns) && (result.serverName !== $scope.dataModel
                        .updatedHostName || result.description !== $scope.dataModel.updatedDescription || result.ipAddress !== $scope.dataModel.updatedIpAddress ||
                        result.osType !== $scope.dataModel.updatedOsType || wwns !== $scope.dataModel.updatedWwns);
                }
            };
        });

        $scope.updateHost = function() {
            updateHostWwns();
            updateHostFields();
            window.history.back();
        };

        function updateHostWwns() {

            var updatedWwns = [];
            _.forEach($scope.dataModel.updatedWwns.split(','), function(w) {
                w = w.trim();
                updatedWwns.push(w);
            });

            var originalWwns = $scope.dataModel.originalHost.wwpns;
            var wwnToAdd = _.difference(updatedWwns, originalWwns);
            var wwnToRemove = _.difference(originalWwns, updatedWwns);

            if (wwnToAdd.length > 0) {
                orchestratorService.addHostWwn(hostId, {
                    wwpns: wwnToAdd
                });
            }

            if (wwnToRemove.length > 0) {
                orchestratorService.removeHostWwn(hostId, {
                    wwpns: wwnToRemove
                });
            }
        }

        function updateHostFields() {
            var payload = {};
            var host = $scope.dataModel.originalHost;

            if (host.serverName !== $scope.dataModel.updatedHostName) {
                payload.serverName = $scope.dataModel.updatedHostName;
            }

            if (host.description !== $scope.dataModel.updatedDescription) {
                payload.description = $scope.dataModel.updatedDescription;
            }

            if (host.ipAddress !== $scope.dataModel.updatedIpAddress) {
                payload.ipAddress = $scope.dataModel.updatedIpAddress;
            }

            if (host.osType !== $scope.dataModel.updatedOsType) {
                payload.osType = $scope.dataModel.updatedOsType;
            }

            if (payload.serverName || payload.description || payload.ipAddress || payload.osType) {
                orchestratorService.updateHost(hostId, payload);
            }
        }
    });
