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
            queryReservedResource: function (reservedResource, parentResId, parentResType) {
                var res = reservedResource.split('=');
                var resId = res[0];
                var resType = res[1];
                resourceTrackerService.setSearchParameters(resId, resType, parentResId, parentResType);
                return paginationService.getQuery('resource-tracker/reserved-resources', null, null);
            },

            showReservedPopUpOrSubmit: function(reservedResourcesList, parentResId, parentResType,
                                         message, storageSystemId, resourceId, resourcePayload, orchestratorFunction, urlRedirectFunction, bulkUpdateFlag) {
                var queries = _.map(reservedResourcesList, function (reservedResource) {
                    return resourceTrackerService.queryReservedResource(reservedResource, parentResId, parentResType);
                });
                resourceTrackerService.showReservedPopUpOrSubmitQuery(
                    queries, message, storageSystemId, resourceId, resourcePayload, orchestratorFunction,
                    urlRedirectFunction, bulkUpdateFlag);
            },

            showReservedPopUpOrSubmitQuery: function(queries, message, storageSystemId, resourceId, resourcePayload,
                                                     orchestratorFunction, urlRedirectFunction, bulkUpdateFlag) {
                var flag = false;
                var tasks = _.map(queries, function (reservedResourceQuery) {
                    return reservedResourceQuery.then(function(result) {
                        if(result.reservedResources.length > 0) {
                            flag = true;
                        }
                    });
                });
                $q.all(tasks).then(function () {
                    if(flag) {
                        resourceTrackerService.showPopUp(message, storageSystemId, resourceId, resourcePayload, orchestratorFunction, urlRedirectFunction, bulkUpdateFlag);
                    } else {
                        if(orchestratorFunction) {
                            if(resourcePayload) {
                                if(resourceId && storageSystemId) {
                                    if(bulkUpdateFlag) {
                                        var bulkUpdateTasks = _.map(resourceId, function (rId) {
                                            return orchestratorFunction(storageSystemId, rId, resourcePayload).then(function () {
                                            });
                                        });
                                        $q.all(bulkUpdateTasks).then(function () {
                                            window.history.back();
                                        });
                                    } else {
                                        orchestratorFunction(storageSystemId, resourceId, resourcePayload).then(function () {
                                            window.history.back();
                                        });
                                    }
                                } else if(!resourceId && !storageSystemId) {
                                    if(resourcePayload instanceof Array) {
                                        var bulkPayloadTasks = _.map(resourcePayload, function (payload) {
                                            return orchestratorFunction(payload).then(function () {
                                            });
                                        });
                                        $q.all(bulkPayloadTasks).then(function () {
                                            window.history.back();
                                        });
                                    } else {
                                        orchestratorFunction(resourcePayload).then(function () {
                                            window.history.back();
                                        });
                                    }
                                } else {
                                    orchestratorFunction(storageSystemId, resourcePayload).then(function () {
                                        window.history.back();
                                    });
                                }
                            } else {
                                _.forEach(resourceId, function (rId) {
                                    orchestratorFunction(storageSystemId, rId);
                                });
                            }
                        } else {
                            urlRedirectFunction();
                        }
                    }
                });
            },

            setSearchParameters: function(resId, resType, parentResId, parentResType) {
                paginationService.clearQuery();
                paginationService.addSearchParameter(new paginationService.QueryObject('resId', new paginationService.SearchType().STRING, resId));
                paginationService.addSearchParameter(new paginationService.QueryObject('resType', new paginationService.SearchType().STRING, resType));
                paginationService.addSearchParameter(new paginationService.QueryObject('parentResId', new paginationService.SearchType().STRING, parentResId));
                paginationService.addSearchParameter(new paginationService.QueryObject('parentResType', new paginationService.SearchType().STRING, parentResType));
            },

            showPopUp: function(message, storageSystemId, resourceId, resourcePayload, orchestratorFunction, urlRedirectFunction, bulkUpdateFlag) {
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
                            if(orchestratorFunction) {
                                if(resourcePayload) {
                                    if(resourceId && storageSystemId) {
                                        if(bulkUpdateFlag) {
                                            var bulkUpdateTasks = _.map(resourceId, function (rId) {
                                                return orchestratorFunction(storageSystemId, rId, resourcePayload).then(function () {
                                                });
                                            });
                                            $q.all(bulkUpdateTasks).then(function () {
                                                window.history.back();
                                            });
                                        } else {
                                            orchestratorFunction(storageSystemId, resourceId, resourcePayload).then(function () {
                                                window.history.back();
                                            });
                                        }
                                    } else if(!resourceId && !storageSystemId) {
                                        if(resourcePayload instanceof Array) {
                                            var bulkPayloadTasks = _.map(resourcePayload, function (payload) {
                                                return orchestratorFunction(payload).then(function () {
                                                });
                                            });
                                            $q.all(bulkPayloadTasks).then(function () {
                                                window.history.back();
                                            });
                                        } else {
                                            modelInstance.close(true);
                                            orchestratorFunction(resourcePayload).then(function () {
                                                window.history.back();
                                            });
                                        }
                                    } else {
                                        orchestratorFunction(storageSystemId, resourcePayload).then(function () {
                                            window.history.back();
                                        });
                                    }
                                } else {
                                    _.forEach(resourceId, function (rId) {
                                        orchestratorFunction(storageSystemId, rId);
                                    });
                                }
                            } else {
                                urlRedirectFunction();
                            }
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
            },
            hostGroup: function() {
                return 'HOST_GROUP';
            }
        };
        return resourceTrackerService;
    });
