'use strict';

/**
 * @ngdoc service
 * @name rainierApp.resourceTrackerService
 * @description
 * # resourceTrackerService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('resourceTrackerService', function ($q, $modal,orchestratorService, paginationService) {
        var resourceTrackerService =
        {
            showReservedPopUpOrSubmit: function(reservedResourcesList, parentResId, parentResType,
                                         message, storageSystemId, resourceId, resourcePayload, orchestratorFunction) {
                var flag = false;
                var tasks = _.map(reservedResourcesList, function (reservedResource) {
                    var res = reservedResource.split('=');
                    var resId = res[0];
                    var resType = res[1];
                    resourceTrackerService.setSearchParameters(resId, resType, parentResId, parentResType);
                    return paginationService.getQuery('resource-tracker/reserved-resources', null, null).then(function(result) {
                        if(result.reservedResources.length > 0) {
                            flag = true;
                        }
                    });
                });
                $q.all(tasks).then(function () {
                    if(flag) {
                        resourceTrackerService.showPopUp(message, storageSystemId, resourceId, resourcePayload, orchestratorFunction);
                    } else {
                        orchestratorFunction(storageSystemId, resourceId, resourcePayload).then(function () {
                            window.history.back();
                        });
                    }
                });
            },

            setSearchParameters: function(resId, resType, parentResId, parentResType) {
                paginationService.addSearchParameter(new paginationService.QueryObject('resId', new paginationService.SearchType().STRING, resId));
                paginationService.addSearchParameter(new paginationService.QueryObject('resType', new paginationService.SearchType().STRING, resType));
                paginationService.addSearchParameter(new paginationService.QueryObject('parentResId', new paginationService.SearchType().STRING, parentResId));
                paginationService.addSearchParameter(new paginationService.QueryObject('parentResType', new paginationService.SearchType().STRING, parentResType));
            },

            showPopUp: function(message, storageSystemId, resourceId, resourcePayload, orchestratorFunction) {
                var modelInstance = $modal.open({
                    templateUrl: 'views/templates/resource-tracker-confirmation-modal.html',
                    windowClass: 'modal fade confirmation',
                    backdropClass: 'modal-backdrop',
                    controller: function ($scope) {
                        $scope.message = message;
                        $scope.cancel = function () {
                            modelInstance.dismiss('cancel');
                        };

                        $scope.ok = function() {
                            orchestratorFunction(storageSystemId, resourceId, resourcePayload).then(function () {
                                window.history.back();
                            });
                            modelInstance.close(true);
                        };

                        modelInstance.result.finally(function() {
                            $scope.cancel();
                        });
                    }
                });
            },
            storageSystem: function() {
                return 'STORAGE_SYSTEM';
            },
            storagePool: function() {
                return 'STORAGE_POOL';
            },
            parityGroup: function() {
                return 'PARITY_GROUP';
            },
            volume: function() {
                return 'VOLUME';
            },
            disk: function() {
                return 'DISK';
            }
        };
        return resourceTrackerService;
    });
