'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:HostUpdateCtrl
 * @description
 * # HostUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('HostUpdateCtrl', function (
        $scope, $routeParams, $q, orchestratorService, wwnService, constantService
    ) {
        var hostId = $routeParams.hostId;

        var addedEndPoints = [{value: ''}];

        function setEndPointValues(host) {
            var endPoints = [];
            _.forEach(host.endPoints, function (endPoint) {
                var val = host.protocol === 'FIBRE' ? wwnService.appendColon(endPoint) : endPoint;
                endPoints.push({value: val});
            });

            return endPoints;
        }

        function hasValueEndPoint(endPoints) {
            for (var i = 0; i < endPoints.length; i++) {
                if (!_.isEmpty(endPoints[i].value)) {
                    return true;
                }
            }

            return false;
        }

        function generateChap(host) {
            return {
                chapUser: host.chapUser,
                mutualUser: host.mutualChapUser,
                chapEnabled: !_.isEmpty(host.chapUser),
                mutualEnabled: !_.isEmpty(host.mutualChapUser),
                chapSecret: '',
                mutualChapSecret: ''
            };
        }

        orchestratorService.host(hostId).then(function (result) {

            $scope.dataModel = {
                chap: generateChap(result),
                updateChapSecret: false,
                updateMutualSecret: false,
                protocol: result.protocol,
                originalHost: result,
                updatedHostName: result.serverName,
                updatedDescription: result.description,
                updatedIpAddress: result.ipAddress,
                updatedOsType: result.osType,
                updatedEndPoints: setEndPointValues(result),
                addedEndPoints: addedEndPoints,
                applyChangesToAttachedVolumes: false,
                existingEndPointsChanged: function () {
                    return differentEndPoints($scope.dataModel.originalHost.endPoints, $scope.dataModel.updatedEndPoints);
                },
                requireSelection: false,
                osTypes: constantService.osType(),
                isValid: function () {
                    return !_.isEmpty(this.updatedHostName) && !_.isEmpty(this.updatedOsType) && !_.isEmpty(this.updatedEndPoints) && (result.serverName !== $scope.dataModel
                            .updatedHostName || result.description !== $scope.dataModel.updatedDescription || result.ipAddress !== $scope.dataModel.updatedIpAddress ||
                        result.osType !== $scope.dataModel.updatedOsType ||
                        hasValueEndPoint($scope.dataModel.addedEndPoints) ||
                        differentEndPoints($scope.dataModel.originalHost.endPoints, $scope.dataModel.updatedEndPoints));
                },
                deleteEndPoint: function (index) {
                    $scope.dataModel.addedEndPoints.splice(index, 1);
                },
                addNewEndPoint: function () {
                    $scope.dataModel.addedEndPoints.splice(0, 0, {value: ''});
                }
            };

            $scope.updateHost = function () {
                if (!$scope.dataModel.isValid()) {
                    return;
                }

                Promise.all([
                    updateHostEndPoints(),
                    updateHostFields()
                ]).then(function () {
                    window.history.back();
                });
            };
        });

        function invokeTrim(endPoint) {
            var result = endPoint.trim();
            if ($scope.dataModel.protocol === 'FIBRE') {
                result = wwnService.removeSymbol(result);
            }
            return result;
        }

        function differentEndPoints(originaEndPoints, updatedEndPoints) {
            if (originaEndPoints.length !== updatedEndPoints.length) {
                return true;
            }
            for (var i = 0; i < originaEndPoints.length; ++i) {
                var updatedEndPoint = invokeTrim(updatedEndPoints[i].value);
                if (originaEndPoints[i] !== updatedEndPoint) {
                    return true;
                }
            }

            return false;
        }
        
        function postFibreEndPoint(hostId, endPointPayload) {
            // In UI, when users want to update the attached volumes, we also update the zones.
            return orchestratorService.updateHostWwn(hostId, {
                'updates': endPointPayload,
                'updateAttachedVolumes': $scope.dataModel.applyChangesToAttachedVolumes,
                'updateZones': $scope.dataModel.applyChangesToAttachedVolumes
            });
        }

        function postIscsiEndPoint(hostId, endPointPayload) {
            return orchestratorService.updateHostIscsi(hostId, {
                updateAttachedVolumes: $scope.dataModel.applyChangesToAttachedVolumes,
                iscsiNameUpdates: endPointPayload
                // TODO impl for chap auth
            });
        }

        function invokeEndPointPost(hostId, endPointPayload) {
            if ($scope.dataModel.protocol === 'FIBRE') {
                return postFibreEndPoint(hostId, endPointPayload);
            } else if ($scope.dataModel.protocol === 'ISCSI') {
                return postIscsiEndPoint(hostId, endPointPayload);
            }
            return Promise.resolve();
        }

        function updateHostEndPoints() {

            var updatedEndPoints = [];
            var endPointDiffPayload = [];
            _.forEach($scope.dataModel.updatedEndPoints, function (e) {
                var updatedEndPoint = invokeTrim(e.value);
                updatedEndPoints.push(updatedEndPoint);
            });

            _.forEach($scope.dataModel.addedEndPoints, function (e) {
                var addedEndPoint = invokeTrim(e.value);
                if (!_.isEmpty(addedEndPoint)) {
                    endPointDiffPayload.push(
                        {
                            'currentValue': null,
                            'newValue': addedEndPoint
                        }
                    );
                }
            });

            var originalEndPoints = $scope.dataModel.originalHost.endPoints;
            for (var i = 0; i < originalEndPoints.length; ++i) {
                var original = originalEndPoints[i];
                var updated = updatedEndPoints[i];
                if (original !== updated) {
                    endPointDiffPayload.push(
                        {
                            'currentValue': original,
                            'newValue': _.isEmpty(updated) ? null : updated
                        }
                    );
                }
            }

            if (endPointDiffPayload.length > 0) {
                return invokeEndPointPost(hostId, endPointDiffPayload);
            }
            return Promise.resolve();

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
                return orchestratorService.updateHost(hostId, payload);
            }
            return Promise.resolve();
        }
    });
