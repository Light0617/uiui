


'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:SharesUpdateCtrl
 * @description
 * # SharesUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('GroupsAddCtrl', function($scope, $timeout, $routeParams, orchestratorService) {

        var storageSystemId = $routeParams.storageSystemId;
        var fileSystemId = $routeParams.fileSystemId;
        var shareId = $routeParams.shareId;

            var dataModel = {
                validationForm: {
                    label: ''
                },
                permission: {
                    // [Full control, change, read]
                    'allow' :[ false, false, false ],
                    'deny' :[ false, false, false ]
                }
            };

            $scope.dataModel = dataModel;

            $scope.dataModel.canSubmit = function () {
                return $scope.dataModel.validationForm.label.$valid;
            };

            $scope.dataModel.change = function (allow, type) {
                var actionArray = $scope.dataModel.permission.deny;
                if(allow) {
                    actionArray = $scope.dataModel.permission.allow;
                }
                var arrayToDeselect = [false, false, false];
                if(type === 'full') {
                    actionArray = [true, true, true];
                }
                else if(type === 'change') {
                    if(!actionArray[1]) {
                        actionArray = [false, true, true];
                    }
                    else {
                        actionArray = [false, false, actionArray[2]];
                    }
                }
                else {
                    if(!actionArray[2]) {
                        actionArray = [false, false, true];
                    }
                    else {
                        actionArray = [false, false, false];
                    }
                }
                if(allow) {
                    $scope.dataModel.permission.allow = actionArray;
                    $scope.dataModel.permission.deny = arrayToDeselect;
                }
                else {
                    $scope.dataModel.permission.deny = actionArray;
                    $scope.dataModel.permission.allow = arrayToDeselect;
                }
            };

            $scope.dataModel.submit = function () {
                var dataModel = $scope.dataModel;
                var payload = {

                    permissions: [
                        {
                            groupName : dataModel.label,
                            permissionType: {
                                allowFullControl: dataModel.permission.allow[0],
                                allowRead: dataModel.permission.allow[2],
                                allowChange: dataModel.permission.allow[1],
                                denyFullControl: dataModel.permission.deny[0],
                                denyRead: dataModel.permission.deny[2],
                                denyChange: dataModel.permission.deny[1]
                            }
                        }]
                };
                orchestratorService.patchShare(storageSystemId, fileSystemId, shareId, payload).then(function () {
                    window.history.back();
                });
            };

    });
