'use strict';

/**
 * @ngdoc service
 * @name rainierApp.replicationGroupsService
 * @description
 * # replicationGroupsService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('replicationGroupsService', function ($log, Restangular, queryService, objectTransformService,
                                                   apiResponseHandlerService, paginationService, replicationService) {
        return {
            //TODO: CDUAN it's working now, but because it's checked in before we created pagination-service.js
            // need to change it to use Ernest's pattern
            ExternalReplicationGroup: function ExternalReplicationGroup (type) {
                this.id = replicationService.rawReplicationType(type);
                this.storageSystemId = 'N/A';
                this.name = 'External';
                this.comments = 'N/A';
                this.type = type;
                this.consistent = 'N/A';this.numberOfCopies = 'N/A';
                this.schedule = 'N/A';
                this.scheduleEnabled = 'N/A';this.primaryVolumeIds = [];
                this.failures = 'N/A';
                this.status = 'N/A';
                this.isExternal = true;
                this.noSelection = true;
                this.volumePairs = [];
                this.naturalLanguageSchedule = 'N/A';
            },
            getVolumePairsForOneReplicationGroup: function (token, storageSystemId, replicationGroup, volumeId) {
                var queryParams = {q: ['type:' + replicationService.rawReplicationType(replicationGroup.type)]};
                if (volumeId !== undefined) {
                    queryParams.q[0] = queryParams.q[0] + ' AND primaryVolume.id:' + parseInt(volumeId);
                }
                if (replicationGroup.hasOwnProperty('isExternal')) {
                    queryParams.q[0] = queryParams.q[0] + ' AND _missing_:replicationGroup';
                    if (token !== undefined) {
                        queryParams.nextToken = token;
                    }
                    return apiResponseHandlerService._apiGetResponseHandler(Restangular
                        .one('storage-systems', storageSystemId)
                        .one('volume-pairs')
                        .get(queryParams)
                        .then(function (result) {
                            return result;
                        }));
                } else {
                    queryParams.q[0] = queryParams.q[0] + ' AND replicationGroup:' +
                        replicationGroup.name.toString();
                    if (token !== undefined) {
                        queryParams.nextToken = token;
                    }
                    return apiResponseHandlerService._apiGetResponseHandler(Restangular
                        .one('storage-systems', storageSystemId)
                        .one('volume-pairs')
                        .get(queryParams)
                        .then(function (result) {
                            return result;
                        }));
                }
            },
            cloneExternalVolumePairExists: function (storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('_missing_', 'replicationGroup');
                queryService.setQueryMapEntry('type', 'CLONE');

                return apiResponseHandlerService._apiGetResponseHandler(Restangular
                    .one('storage-systems', storageSystemId)
                    .one('volume-pairs')
                    .get(queryService.getQueryParameters(true))
                    .then(function (result) {
                        return result.total;
                    }));
            },
            snapshotExternalVolumePairExists: function (storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('_missing_', 'replicationGroup');
                queryService.setQueryMapEntry('type', 'SNAPSHOT');

                return apiResponseHandlerService._apiGetResponseHandler(Restangular
                    .one('storage-systems', storageSystemId)
                    .one('volume-pairs')
                    .get(queryService.getQueryParameters(true))
                    .then(function (result) {
                        return result.total;
                    }));
            },
            snapshotExtendableExternalVolumePairExists: function (storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('_missing_', 'replicationGroup');
                queryService.setQueryMapEntry('type', 'SNAPSHOT_EXTENDABLE');

                return apiResponseHandlerService._apiGetResponseHandler(Restangular
                    .one('storage-systems', storageSystemId)
                    .one('volume-pairs')
                    .get(queryService.getQueryParameters(true))
                    .then(function (result) {
                        return result.total;
                    }));
            },
            snapshotFullcopyExternalVolumePairExists: function (storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('_missing_', 'replicationGroup');
                queryService.setQueryMapEntry('type', 'SNAPSHOT_FULLCOPY');

                return apiResponseHandlerService._apiGetResponseHandler(Restangular
                    .one('storage-systems', storageSystemId)
                    .one('volume-pairs')
                    .get(queryService.getQueryParameters(true))
                    .then(function (result) {
                        return result.total;
                    }));
            },
            getReplicationGroups: function (token, storageSystemId, isFirstTime) {
                if (isFirstTime !== undefined) {
                    paginationService.clearQuery();
                }

                $log.debug('token: ', token);

                var queryParams = queryService.getQueryParameters(true);

                if (token !== undefined) {
                    queryParams.nextToken = token;
                }

                return apiResponseHandlerService._apiGetResponseHandler(Restangular
                    .one('storage-systems', storageSystemId)
                    .one('replication-groups')
                    .get(queryParams)
                    .then(function (result) {
                        _.forEach(result.resources, function (item) {
                            objectTransformService.transformReplicationGroup(item);
                        });
                        return result;
                    }));
            },
            getSortedAndFilteredReplicationGroups: function (storageSystemId, externalReplicationGroups) {
                _.forEach(externalReplicationGroups, function (er) {
                    er.volumePairs = [];
                    er.opened = false;
                });
                var queryParams = queryService.getQueryParameters(true);
                queryParams.nextToken = null;
                var currentSortBy = queryService.getSortBy();
                var currentSortOrder = queryService.getSortReverse();
                var currentReplicationGroupType = queryService.getQuery('type');
                var currentReplicationGroupTextSearch = queryService.getQuery('replicationGroupTextSearch');
                if (currentReplicationGroupType !== undefined) {
                    externalReplicationGroups = _.filter(externalReplicationGroups, function (rg) {
                        return replicationService.rawReplicationType(rg.type) ===
                            replicationService.rawReplicationType(currentReplicationGroupType.queryText)
                    });
                }
                if (currentReplicationGroupTextSearch !=undefined) {
                    externalReplicationGroups = _.filter(externalReplicationGroups, function (rg) {
                        return rg.name.toString().toUpperCase().indexOf(currentReplicationGroupTextSearch.queryText.freeText.toUpperCase()) !== -1;
                    });
                }
                return apiResponseHandlerService._apiGetResponseHandler(Restangular
                    .one('storage-systems', storageSystemId)
                    .one('replication-groups')
                    .get(queryParams)
                    .then(function (result) {
                        _.forEach(result.resources, function (item) {
                            objectTransformService.transformReplicationGroup(item);
                        });
                        if (currentSortBy !== undefined) {
                            if (currentSortOrder) {
                                result.resources = _.sortBy(result.resources.concat(externalReplicationGroups),
                                    currentSortBy.toString()).reverse();
                            } else {
                                result.resources = _.sortBy(result.resources.concat(externalReplicationGroups),
                                    currentSortBy.toString());
                            }
                            return result;

                        } else {
                            result.resources = result.resources.concat(externalReplicationGroups);
                            return result;
                        }
                    }));
            },
            setTypeSearch: function (filterModel) {
                if (!_.isEmpty(filterModel) && !_.isEmpty(filterModel.type)) {
                    var queryObject = queryService.getQueryObjectInstance('type', filterModel.type);
                    queryService.setQueryObject(queryObject);
                } else {
                    queryService.removeQueryMapEntry('type');
                }
            },
            setTextSearch: function (filterModel) {
                if (_.isEmpty(filterModel.freeText)) {
                    queryService.removeQueryMapEntry('replicationGroupTextSearch');
                } else {
                    var queryObject = queryService.getQueryObjectInstance('replicationGroupTextSearch', filterModel);
                    queryObject.queryStringFunction = function() {
                        return 'name:' + paginationService.getPartialSearchQueryString(filterModel.freeText);
                    };
                    queryService.setQueryObject(queryObject);
                }
            }
        };
    });
