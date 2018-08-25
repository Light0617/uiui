'use strict';

/**
 * @ngdoc service
 * @name rainierApp.virtualStorageMachineDetailsService
 * @description
 * # virtualStorageMachineDetailsService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('virtualStorageMachineDetailsService', function ($log, Restangular, queryService, objectTransformService,
                                                   apiResponseHandlerService, paginationService, replicationService) {
        return {
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
            }
        }
    });
