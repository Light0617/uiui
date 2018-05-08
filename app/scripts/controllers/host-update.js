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
        $scope, $routeParams, $q, orchestratorService, wwnService, constantService,
        $modal, synchronousTranslateService, utilService
    ) {
        var hostId = $routeParams.hostId;

        var addedEndPoints = [{ value: '' }];

        function setEndPointValues (host) {
            var endPoints = [];
            _.forEach(host.endPoints, function (endPoint) {
                var val = host.protocol === 'FIBRE' ? wwnService.appendColon(endPoint) : endPoint;
                endPoints.push({ value: val });
            });

            return endPoints;
        }

        function hasValueEndPoint (endPoints) {
            for (var i = 0; i < endPoints.length; i++) {
                if (!_.isEmpty(endPoints[i].value)) {
                    return true;
                }
            }

            return false;
        }

        function generateChap (host) {
            if (host.protocol !== 'ISCSI') {
                return undefined;
            }
            return {
                chapEnabled: !_.isEmpty(host.chapUser),
                chapUser: host.chapUser,
                chapSecret: '',
                updateChapCredential: _.isEmpty(host.chapUser)
            };
        }

        var chapPayload = function (chap) {
            // CHAP PAYLOAD RULES
            //1. DISABLE CHAP > empty object
            //2. ENABLE BUT KEEP CREDENTIAL > undefined (null)
            //3. ENABLE AND UPDATE CREDENTIAL > fill object with userName and secret
            //4. IF CHAP IS DISABLED, MUTUAL CHAP SHOULD BE DISABLED

            if (!chap.chapEnabled) {
                return {
                    chapUser: {}
                };
            }


            var result = {};

            if (chap.updateChapCredential) {
                result.chapUser = {
                    userName: chap.chapUser,
                    secret: chap.chapSecret
                };
            }

            return result;
        };


        orchestratorService.host(hostId).then(function (result) {

            $scope.dataModel = {
                chap: generateChap(result),
                originalChap: generateChap(result),
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
                    var valid = !_.isEmpty(this.updatedHostName) &&
                        !_.isEmpty(this.updatedOsType) &&
                        !_.isEmpty(this.updatedEndPoints) &&
                        validChap($scope.dataModel.chap, $scope.dataModel.originalChap);

                    var different = differentEndPoints($scope.dataModel.originalHost.endPoints, $scope.dataModel.updatedEndPoints) ||
                        hasValueEndPoint($scope.dataModel.addedEndPoints) ||
                        differentChapPayload($scope.dataModel.chap, $scope.dataModel.originalChap) ||
                        result.serverName !== $scope.dataModel.updatedHostName ||
                        result.description !== $scope.dataModel.updatedDescription ||
                        result.ipAddress !== $scope.dataModel.updatedIpAddress ||
                        result.osType !== $scope.dataModel.updatedOsType;
                    return valid && different;
                },
                deleteEndPoint: function (index) {
                    $scope.dataModel.addedEndPoints.splice(index, 1);
                },
                addNewEndPoint: function () {
                    $scope.dataModel.addedEndPoints.splice(0, 0, { value: '' });
                },
                applyChangesAttachedVolumesConfirmationMessage: synchronousTranslateService.translate(
                    result.protocol === 'FIBRE' ? 'host-update-fibre-confirmation-content' : 'host-update-iscsi-confirmation-content')
            };

            $scope.chapPayload = chapPayload;

            $scope.updateHost = function () {
                if (!$scope.dataModel.isValid()) {
                    return;
                }

                if ($scope.dataModel.chap && $scope.dataModel.chap.chapEnabled === true &&
                    $scope.dataModel.chap.updateChapCredential === true &&
                    !utilService.isNullOrUndefOrBlank($scope.dataModel.chap.chapSecret)) {

                    var hasDiffChapUser = differentChapPayload($scope.dataModel.chap, $scope.dataModel.originalChap);
                    var modelInstance = $modal.open({
                        templateUrl: 'views/templates/basic-confirmation-modal.html',
                        windowClass: 'modal fade confirmation',
                        backdropClass: 'modal-backdrop',
                        controller: function ($scope) {
                            $scope.confirmationTitle = synchronousTranslateService.translate(
                                'host-update-chap-confirm-overwrite-chap-secret-title');
                            $scope.confirmationMessage = synchronousTranslateService.translate(
                                'host-update-chap-confirm-overwrite-chap-secret-message');
                            $scope.cancelButtonLabel = synchronousTranslateService.translate(
                                'cancel-button');
                            $scope.okButtonLabel = synchronousTranslateService.translate(
                                'ok-button');

                            $scope.ok = function () {
                                var updateTasks = [];
                                var endPointDiffPayload = createEndPointDiffPayload();
                                if (!_.isEmpty(endPointDiffPayload) || hasDiffChapUser) {
                                    updateTasks.push(invokeEndPointPost(hostId, endPointDiffPayload));
                                }
                                updateTasks.push(updateHostFields());

                                $q.all(updateTasks).then(function () {
                                    modelInstance.close(true);
                                    window.history.back();
                                }, function () {
                                    modelInstance.close(true);
                                });
                            };

                            $scope.cancel = function () {
                                modelInstance.dismiss(synchronousTranslateService.translate('common-label-cancel'));
                            };

                            modelInstance.result.finally(function () {
                                $scope.cancel();
                            });
                        }
                    });
                } else {
                    $q.all([
                        invokeEndPointPost(hostId, createEndPointDiffPayload()),
                        updateHostFields()
                    ]).then(function () {
                        window.history.back();
                    });
                }
            };
        });

        function invokeTrim (endPoint) {
            var result = endPoint.trim();
            if ($scope.dataModel.protocol === 'FIBRE') {
                result = wwnService.removeSymbol(result);
            }
            return result;
        }

        function differentEndPoints (originaEndPoints, updatedEndPoints) {
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

        function differentChapPayload (after, before) {
            if (_.isUndefined(after) && _.isUndefined(before)) {
                return false;
            }

            if (after.chapEnabled && after.updateChapCredential) {
                return true;
            }
            return !_.isEqual($scope.chapPayload(after), chapPayload(before));

        }

        function validChap (chap) {
            if (_.isUndefined(chap)) {
                return true;
            }
            if (chap.chapEnabled && _.isEmpty(chap.chapUser)) {
                return false;
            }

            return !(chap.chapEnabled && chap.updateChapCredential &&
                (_.isEmpty(chap.chapUser) || _.isEmpty(chap.chapSecret)));
        }

        function postFibreEndPoint (hostId, endPointPayload) {
            if (endPointPayload.length === 0) {
                return $q.resolve();
            }

            // In UI, when users want to update the attached volumes, we also update the zones.
            return orchestratorService.updateHostWwn(hostId, {
                'updates': endPointPayload,
                'updateAttachedVolumes': $scope.dataModel.applyChangesToAttachedVolumes,
                'updateZones': $scope.dataModel.applyChangesToAttachedVolumes
            });
        }

        function postIscsiEndPointAndChap (hostId, endPointPayload) {
            var chapPayload = $scope.chapPayload($scope.dataModel.chap);
            return orchestratorService.updateHostIscsi(hostId, {
                updateAttachedVolumes: $scope.dataModel.applyChangesToAttachedVolumes,
                iscsiNameUpdates: endPointPayload,
                chapUser: chapPayload.chapUser
            });
        }

        function invokeEndPointPost (hostId, endPointPayload) {
            if ($scope.dataModel.protocol === 'FIBRE') {
                return postFibreEndPoint(hostId, endPointPayload);
            } else if ($scope.dataModel.protocol === 'ISCSI') {
                return postIscsiEndPointAndChap(hostId, endPointPayload);
            }
            return $q.resolve();
        }

        function createEndPointDiffPayload () {
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
            return endPointDiffPayload;
        }

        function updateHostFields () {
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
            return $q.resolve();
        }
    });
