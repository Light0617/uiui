/*
 * ========================================================================
 *
 * Copyright (c) by Hitachi Vantara, 2017. All rights reserved.
 *
 * ========================================================================
 */

'use strict';

/**
 * @ngdoc function
 * @name rainierApp.controller:ExternalVolumesAddCtrl
 * @description
 * # ExternalVolumesAddCtrl
 * Controller of the rainierApp
 */
angular.module('rainierApp').controller('ExternalVolumesAddCtrl', function (
    $q, $scope, $window, $routeParams, externalVolumesAddService, utilService, viewModelService
) {
    var backToPreviousView = function () {
        $window.history.back();
    };

    var init = function () {
        $scope.dataModel = viewModelService.newWizardViewModel([
            'selectPorts', 'selectEndPoints', 'selectLuns', 'selectServers', 'selectPaths'
        ]);
        _.extend($scope.dataModel, {
            portsModel: {
                footerModel: {}
            },
            endPointsModel: {
                footerModel: {}
            },
            lunsModel: {
                footerModel: {}
            },
            serversModel: {
                footerModel: {}
            },
            pathsModel: {
                footerModel: {}
            }
        });
        $scope.dataModel.storageSystemId = extractStorageSystemId();
    };

    var extractStorageSystemId = function () {
        var result = $routeParams.storageSystemId;
        if (utilService.isNullOrUndef(result)) {
            backToPreviousView();
        }
        return result;
    };

    init();
});
