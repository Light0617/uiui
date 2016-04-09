'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:FabricSwitchAddCtrl
 * @description
 * # FabricSwitchAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp')
    .controller('FabricSwitchAddCtrl', function($scope, $routeParams, $timeout, $window, $filter, orchestratorService) {
        var switchTypes = orchestratorService.switchTypes();
        var defaultPrincipalSwitchPortNumber = orchestratorService.defaultPrincipalSwitchPortNumber();

        var dataModel = {
            fabricSwitches: [],
            switchTypes: switchTypes,
            add: function () {
                var self = this;
                var item = {
                    virtualFabricId: '',
                    principalSwitchAddress: '',
                    switchType: '',
                    principalSwitchPortNumber: defaultPrincipalSwitchPortNumber,
                    principalSwitchUsername: '',
                    principalSwitchPassword: ''
                };

                item.isValid = function () {
                    return _.every([item.principalSwitchAddress, item.switchType, item.principalSwitchPortNumber, item.principalSwitchUsername, item.principalSwitchPassword], function (field) {
                        return !_.isEmpty(field);
                    });
                };

                item.click = function (first) {
                    if (first) {
                        dataModel.add();
                    }
                    else {
                        item.delete();
                    }
                };

                item.delete = function () {
                    $timeout(function () {
                        _.remove(self.fabricSwitches, function (itm) {
                            return itm === item;
                        });
                    });
                };

                self.fabricSwitches.splice(0, 0, item);
            }
        };

        dataModel.add();

        dataModel.canSubmit = function () {
            var iFabricSwitch;
            var cFabricSwitch = dataModel.fabricSwitches.length;

            if (cFabricSwitch < 1){
                return false;
            }

            // Do not skip the first row when validating the submit button
            for (iFabricSwitch = 0; iFabricSwitch < dataModel.fabricSwitches.length; ++iFabricSwitch) {
                var fabricSwitch = dataModel.fabricSwitches[iFabricSwitch];
                if( !fabricSwitch.isValid()){

                    return false;
                }
            }

            return true;
        };

        dataModel.submit = function () {
            var fabricSwitchPayload = buildAddFabricPayload(dataModel.fabricSwitches);
            orchestratorService.addFabrics(fabricSwitchPayload).then(function () {
                window.history.back();
            });
        };

        $scope.dataModel = dataModel;

        function buildAddFabricPayload(fabricSwitches){
            var addFabricPayload = {
                fabrics: []
            };
            for(var fs = 1; fs < fabricSwitches.length; ++fs){
                addFabricPayload.fabrics.push({
                    virtualFabricId: fabricSwitches[fs].virtualFabricId,
                    principalSwitchAddress: fabricSwitches[fs].principalSwitchAddress,
                    principalSwitchUsername: fabricSwitches[fs].principalSwitchUsername,
                    principalSwitchPassword: fabricSwitches[fs].principalSwitchPassword,
                    principalSwitchPortNumber: parseInt(fabricSwitches[fs].principalSwitchPortNumber),
                    switchType : fabricSwitches[fs].switchType
                });
            }
            return addFabricPayload;
        }
    });
