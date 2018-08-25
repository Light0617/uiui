'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:attachVolumeSearch
 * @description
 * # attachVolumeSearch
 */
angular.module('rainierApp')
    .directive('volumeSearch', function (replicationService) {
        var filterDpType = function(dataModel, filterModel) {
            var replicationTypes = [];
            if (dataModel.snapshot) {
                replicationTypes.push(replicationService.rawTypes.SNAP);
            }
            if (dataModel.cloneNow) {
                replicationTypes.push(replicationService.rawTypes.CLONE);
            }
            if (dataModel.snapshotEx) {
                replicationTypes.push(replicationService.rawTypes.SNAP_ON_SNAP);
            }
            if (dataModel.snapshotFc) {
                replicationTypes.push(replicationService.rawTypes.SNAP_CLONE);
            }
            filterModel.filter.replicationTypes = replicationTypes;
        };

        var filterProtectionStatus = function(dataModel, filterModel) {
            var protectionStatusList = [];
            if (dataModel.protected) {
                protectionStatusList.push('P-VOL');
            }
            if (dataModel.unprotected) {
                protectionStatusList.push('UNPROTECTED');
            }
            if (dataModel.secondary) {
                protectionStatusList.push('S-VOL');
            }
            filterModel.filter.protectionStatusList = protectionStatusList;
        };

        return {
            scope: {
                model: '=ngModel',
                filterModel : '=',
                data: '=data',
                select: '&'
            },
            templateUrl: 'views/templates/volume-search.html',
            restrict: 'E',
            link: function(scope) {
                scope.filterDpType = filterDpType;
                scope.filterProtectionStatus = filterProtectionStatus;
            }
        };
    });
