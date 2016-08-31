'use strict';

/**
 * @ngdoc service
 * @name rainierApp.storageSystemVolumeService
 * @description
 * # storageSystemVolumeService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('storageSystemVolumeService', function ($log, Restangular, queryService, objectTransformService,
                                                     apiResponseHandlerService, paginationService) {
        var VOLUME_PAIRS_PATH = 'volume-pairs';
        var REPLICATION_GROUPS_PATH = 'replication-groups';
        return {
            VOLUME_PAIRS_PATH: VOLUME_PAIRS_PATH,
            REPLICATION_GROUPS_PATH: REPLICATION_GROUPS_PATH,
            getVolumePairsAsPVol: function (token, currentVolumeId, storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('primaryVolume.id', parseInt(currentVolumeId));
                return paginationService.get(token,VOLUME_PAIRS_PATH, objectTransformService.transformVolumePairs, false, storageSystemId);
            },
            getVolumePairsAsPVolWithoutSnapshotFullcopy: function (token, currentVolumeId, storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('primaryVolume.id', parseInt(currentVolumeId));
                var queryText = [{text:'SNAPSHOT'}, {text:'SNAPSHOT_EXTENDABLE'}, {text:'CLONE'}]; // TODO: rewrite with must_not query.
                var queryObject = queryService.getQueryObjectInstance('type', queryText);
                queryService.setQueryObject(queryObject);
                return paginationService.get(token,VOLUME_PAIRS_PATH, objectTransformService.transformVolumePairs, false, storageSystemId);
            },
            getVolumePairsAsSVol: function (currentVolumeId, storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('secondaryVolume.id', parseInt(currentVolumeId));
                return paginationService.getQuery(VOLUME_PAIRS_PATH, objectTransformService.transformVolumePairs, storageSystemId);
            },
            getVolumePairsAsPVolAndClone: function (currentVolumeId, storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('primaryVolume.id', parseInt(currentVolumeId));
                queryService.setQueryMapEntry('type', 'CLONE');
                return paginationService.getQuery(VOLUME_PAIRS_PATH, objectTransformService.transformVolumePairs, storageSystemId);
            },
            getVolumePairsAsPVolAndSnapshotAndRGNameExisting: function (currentVolumeId, storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('primaryVolume.id', parseInt(currentVolumeId));
                queryService.setQueryMapEntry('type', 'SNAPSHOT');
                queryService.setQueryMapEntry('_exists_', 'replicationGroup');
                return paginationService.getQuery(VOLUME_PAIRS_PATH, objectTransformService.transformVolumePairs, storageSystemId);
            },
            getVolumePairsAsPVolAndSnapshotAndRGNameMissing: function (currentVolumeId, storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('primaryVolume.id', parseInt(currentVolumeId));
                queryService.setQueryMapEntry('type', 'SNAPSHOT');
                queryService.setQueryMapEntry('_missing_', 'replicationGroup');
                return paginationService.getQuery(VOLUME_PAIRS_PATH, objectTransformService.transformVolumePairs, storageSystemId);
            },
            getVolumePairsAsPVolAndSnapshotExtendableAndRGNameMissing: function (currentVolumeId, storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('primaryVolume.id', parseInt(currentVolumeId));
                queryService.setQueryMapEntry('type', 'SNAPSHOT_EXTENDABLE');
                queryService.setQueryMapEntry('_missing_', 'replicationGroup');
                return paginationService.getQuery(VOLUME_PAIRS_PATH, objectTransformService.transformVolumePairs, storageSystemId);
            },
            getVolumePairsAsPVolAndSnapshotFullcopyAndRGNameMissing: function (currentVolumeId, storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('primaryVolume.id', parseInt(currentVolumeId));
                queryService.setQueryMapEntry('type', 'SNAPSHOT_FULLCOPY');
                queryService.setQueryMapEntry('_missing_', 'replicationGroup');
                return paginationService.getQuery(VOLUME_PAIRS_PATH, objectTransformService.transformVolumePairs, storageSystemId);
            },
            getReplicationGroupByName: function (name, storageSystemId) {
                paginationService.clearQuery();
                queryService.setQueryMapEntry('name', name.toString());
                return paginationService.getQuery(REPLICATION_GROUPS_PATH, objectTransformService.transformReplicationGroup, storageSystemId);
            },
            getMultipleReplicationGroupsByName: function (names, storageSystemId) {
                paginationService.clearQuery();
                var queryObject = queryService.getQueryObjectInstance('getMultipleRGsByName', _.first(names));
                queryObject.queryStringFunction = function() {
                    var listOfSearch = [];
                    _.each(names, function(name) {
                        listOfSearch.push('name' + ':' + name);
                    });
                    return listOfSearch.join(' OR ');
                };
                queryService.setQueryObject(queryObject);
                return paginationService.getQuery(REPLICATION_GROUPS_PATH, objectTransformService.transformReplicationGroup, storageSystemId);
            },
            getGadVolumePairsAsPVolAndSvol: function(token, currentVolumeId, storageSystemId) {
                if (currentVolumeId || currentVolumeId === 0) {
                    // Doing it in this way because querySerice can not handle 'OR' between attributes.
                    // Only way to optimize this is to modify the queryService.
                    var queryParams = {q: ['primary.volumeId:' + currentVolumeId]};
                    queryParams.q[0] = queryParams.q[0] + ' OR secondary.volumeId:' + currentVolumeId;
                    if (token !== undefined) {
                        queryParams.nextToken = token;
                    }
                    return apiResponseHandlerService._apiGetResponseHandler(Restangular
                        .one('storage-systems', storageSystemId)
                        .one('gad-pairs')
                        .get(queryParams)
                        .then(function (result) {
                            return result;
                        }));
                } else {
                    return new paginationService.EmptyResourcePage();
                }
            }
        };
    });
