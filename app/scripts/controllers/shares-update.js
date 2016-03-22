


'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:SharesUpdateCtrl
 * @description
 * # SharesUpdateCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('SharesUpdateCtrl', function($scope, $timeout, $routeParams, orchestratorService, scrollDataSourceBuilderService) {

        var storageSystemId = $routeParams.storageSystemId;
        var fileSystemId = $routeParams.fileSystemId;
        var shareId = $routeParams.shareId;

        orchestratorService.share(storageSystemId, fileSystemId, shareId, true).then(function (result) {
            var dataModel = {
                validationForm: {
                    label: '',
                    fileSystemPath: ''
                },
                accessConfigurationForm: {
                    accessConfiguration: ''
                },
                permission: {
                    // [Full control, change, read]
                    'allow' :[ false, false, false ],
                    'deny' :[ false, false, false ]
                },
                singleView: true,
                view: 'tile',
                allItemsSelected: false,
                share: result,
                search: {
                    permission: null
                },
                sort: {
                    field: 'usageBare',
                    reverse: true,
                    setSort: function (f) {
                        $timeout(function () {
                            if ($scope.dataModel.sort.field === f) {
                                $scope.dataModel.sort.reverse = !$scope.dataModel.sort.reverse;
                            }
                            else {
                                $scope.dataModel.sort.field = f;
                                $scope.dataModel.sort.reverse = false;
                            }
                        });
                    }
                }
            };

            $scope.dataModel = dataModel;

            $scope.dataModel.canSubmit = function () {
                return $scope.dataModel.validationForm.label.$valid && $scope.dataModel.validationForm.fileSystemPath.$valid && $scope.dataModel.accessConfigurationForm.accessConfiguration.$valid &&
                    ($scope.dataModel.validationForm.label.$dirty || $scope.dataModel.validationForm.fileSystemPath.$dirty || $scope.dataModel.accessConfigurationForm.accessConfiguration.$dirty) ||
                    $scope.dataModel.anySelected();
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
                var permissions = [];
                _.forEach(dataModel.getSelectedItems(), function (item) {
                    item.permissionType.allowFullControl = dataModel.permission.allow[0];
                    item.permissionType.allowRead = dataModel.permission.allow[2];
                    item.permissionType.allowChange = dataModel.permission.allow[1];
                    item.permissionType.denyFullControl = dataModel.permission.deny[0];
                    item.permissionType.denyRead = dataModel.permission.deny[2];
                    item.permissionType.denyChange = dataModel.permission.deny[1];
                    permissions.push({
                        groupName: item.name,
                        permissionType: item.permissionType
                    });
                });
                var payload = {
                    fileSystemPath: dataModel.share.fileSystemPath,
                    accessConfiguration: dataModel.share.accessConfiguration,
                    permissions: permissions
                };
                if(permissions.length === 0) {
                    payload = {
                        fileSystemPath: dataModel.share.fileSystemPath,
                        accessConfiguration: dataModel.share.accessConfiguration
                    };
                }
                orchestratorService.patchShare(storageSystemId, fileSystemId, shareId, payload).then(function () {
                    window.history.back();
                });
            };

            $scope.dataModel.permissions = _.uniq(_.map($scope.dataModel.share.permissions, function(permission){ return _.first(permission.metaData).detailsNoSlash[1]; }));
            scrollDataSourceBuilderService.setupDataLoader($scope, $scope.dataModel.share.permissions, 'permissionsSearch');
        });
    });
