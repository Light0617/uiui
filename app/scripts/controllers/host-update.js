'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:HostUpdateCtrl
 * @description
 * # HostUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('HostUpdateCtrl', function ($scope, $routeParams, orchestratorService, wwnService, constantService) {
        var hostId = $routeParams.hostId;

        var addedWwns = [{value:''}];

        function setWwnValues(wwns){
            var wwnObjects = [];
            _.forEach(wwns, function(wwn){
                wwnObjects.push({value:wwn});
            });

            return wwnObjects;
        }

        function hasValueWwns(wwns){
            for(var i = 0; i < wwns.length; i++){
                if (!_.isEmpty(wwns[i].value)){
                    return true;
                }
            }

            return false;
        }

        orchestratorService.host(hostId).then(function(result) {

            $scope.dataModel = {
                originalHost: result,
                updatedHostName: result.serverName,
                updatedDescription: result.description,
                updatedIpAddress: result.ipAddress,
                updatedOsType: result.osType,
                updatedWwns: setWwnValues(result.displayWWNs),
                addedWwns: addedWwns,
                applyChangesToAttachedVolumes: false,
                requireSelection: false,
                osTypes: constantService.osType(),
                isValid: function () {
                    return !_.isEmpty(this.updatedHostName) && !_.isEmpty(this.updatedOsType) && !_.isEmpty(this.updatedWwns) && (result.serverName !== $scope.dataModel
                        .updatedHostName || result.description !== $scope.dataModel.updatedDescription || result.ipAddress !== $scope.dataModel.updatedIpAddress ||
                        result.osType !== $scope.dataModel.updatedOsType ||
                        hasValueWwns($scope.dataModel.addedWwns) ||
                        differentWwns($scope.dataModel.originalHost.wwpns, $scope.dataModel.updatedWwns));
                },
                deleteWwn: function(wwnIndex) {
                    $scope.dataModel.addedWwns.splice(wwnIndex, 1);
                },
                addNewWwn: function(){
                    $scope.dataModel.addedWwns.splice(0,0, {value: ''});
                }
            };
        });

        function differentWwns(originaWwns, updatedWwns){
            if (originaWwns.length !== updatedWwns.length){
                return true;
            }
            for (var i = 0; i < originaWwns.length; ++i){
                var updatedWwn = updatedWwns[i].value.trim();
                updatedWwn = wwnService.removeSymbol(updatedWwn);
                if (originaWwns[i] !== updatedWwn){
                    return true;
                }
            }

            return false;
        }

        $scope.updateHost = function() {
            updateHostWwns();
            updateHostFields();
            window.history.back();
        };

        function updateHostWwns() {

            var updatedWwns = [];
            var wwpnDiffPayload = [];
            _.forEach($scope.dataModel.updatedWwns, function(w) {
                var updatedWwn = w.value.trim();
                updatedWwn = wwnService.removeSymbol(updatedWwn);
                updatedWwns.push(updatedWwn);
            });

            _.forEach($scope.dataModel.addedWwns, function(w) {
                var addedWwn = w.value;
                if (!_.isEmpty(addedWwn)){
                    addedWwn = addedWwn.trim();
                    addedWwn = wwnService.removeSymbol(addedWwn);
                    if (!_.isEmpty(addedWwn)) {
                        wwpnDiffPayload.push(
                            {
                                'currentValue': null,
                                'newValue': addedWwn
                            }
                        );
                    }
                }

            });

            var originalWwns = $scope.dataModel.originalHost.wwpns;
            for (var i = 0; i < originalWwns.length; ++i){
                var originalWwn = originalWwns[i];
                var updatedWwn = updatedWwns[i];
                if (originalWwn !== updatedWwn){
                    wwpnDiffPayload.push(
                        {
                            'currentValue': originalWwn,
                            'newValue': _.isEmpty(updatedWwn) ? null : updatedWwn
                        }
                    );
                }
            }

            if (wwpnDiffPayload.length > 0) {
                // In UI, when users want to update the attached volumes, we also update the zones.
                orchestratorService.updateHostWwn(hostId, {
                    'updates': wwpnDiffPayload,
                    'updateAttachedVolumes': $scope.dataModel.applyChangesToAttachedVolumes,
                    'updateZones': $scope.dataModel.applyChangesToAttachedVolumes
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
