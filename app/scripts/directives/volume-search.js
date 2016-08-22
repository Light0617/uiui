'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:attachVolumeSearch
 * @description
 * # attachVolumeSearch
 */
angular.module('rainierApp')
    .directive('volumeSearch', function () {
        var filterDpType = function(dataModel, filterModel) {
            var replicationTypes = [];
            if (dataModel.snapshot) {
                replicationTypes.push('SNAPSHOT');
            }
            if (dataModel.cloneNow) {
                replicationTypes.push('CLONE');
            }
            if (dataModel.snapshotEx) {
                replicationTypes.push('SNAPSHOT_EXTENDABLE');
            }
            if (dataModel.snapshotFc) {
                replicationTypes.push('SNAPSHOT_FULLCOPY');
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
