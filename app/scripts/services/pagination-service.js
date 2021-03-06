'use strict';

/**
 * @ngdoc service
 * @name rainierApp.paginationService
 * @description
 * # paginationService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('paginationService', function ($q, $log, Restangular, queryService, objectTransformService,
                                            apiResponseHandlerService, diskSizeService) {
        function SearchType () {
            this.STRING = 'string';
            this.INT = 'int';
            this.ARRAY = 'array';
            this.RANGE = 'range';
            this.MISSING = 'missing';
            this.EXISTING = 'existing';
        }
        var type = new SearchType();
        // If we're using a prefix other than "storageSystem", that's when prefix and perfixId will be used.
        function get(path, transform, queryParams, storageSystemId, prefix, prefixId, resourcesKey) {
            if (!resourcesKey) {
                resourcesKey = 'resources';
            }
            if (prefix && prefixId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one(prefix, prefixId)
                    .one(path)
                    .get(queryParams).then(function (result) {
                        var resources = result[resourcesKey];
                        if(transform) {
                            _.forEach(resources, function (item) {
                                if (_.isFunction(transform)) {
                                    transform(item);
                                }
                            });
                        }
                        return result;
                    }));
            }
            else if(storageSystemId) {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one('storage-systems', storageSystemId)
                    .one(path)
                    .get(queryParams).then(function (result) {
                        var resources = result[resourcesKey];
                        if(transform) {
                            _.forEach(resources, function (item) {
                                if (_.isFunction(transform)) {
                                    transform(item);
                                }
                            });
                        }
                        return result;
                    }));
            }
            else {
                return apiResponseHandlerService._apiGetResponseHandler(Restangular.one(path)
                    .get(queryParams).then(function (result) {
                        var resources = result[resourcesKey];
                        if(transform) {
                            _.forEach(resources, function (item) {
                                if (_.isFunction(transform)) {
                                    transform(item);
                                }
                            });
                        }
                        return result;
                    }));
            }
        }
        function getQueryStringForRange(minValue, maxValue) {
            if (!_.isNull(minValue) && !_.isNull(maxValue)) {
                return '[' + minValue + ' TO ' + maxValue + ']';
            }
        }
        function getPartialSearchQueryString(value) {
            var tokens = value.split(' ');
            value = '*' + tokens.join('* *') + '*';
            return value;
        }
        function getQueryStringForList(listModel) {
            if (!_.isEmpty(listModel)) {
                var listItems = listModel.join(' OR ');
                return '(' + listItems + ')';
            }
        }
        function clearQuery() {
            queryService.queryMap = {};
            queryService.setSort(undefined);
        }
        function getAllItems(token, getAllPath, isFirstCall, storageSystemId, storageSystemModel, dataModel){
            if (isFirstCall) {
                clearQuery();
            }
            $log.debug('token: ', token);

            var queryParams = queryService.getQueryParameters(true);

            if (token !== undefined) {
                queryParams.nextToken = token;
            }
            get(getAllPath, null, queryParams, storageSystemId)
                .then(function(result){

                    dataModel.process(result.resources, token);
                    if (result.nextToken === null){
                        return;
                    }

                    getAllItems(result.nextToken, getAllPath, false, storageSystemId, storageSystemModel, dataModel);
                });
        }
        function getAllPromisesHelper (promise, finalResult, deferred, path, transform, queryParams, storageSystemId,
            resourcesKey) {
            promise.then (function (result) {
                finalResult = finalResult.concat(result[resourcesKey]);
                if (result.nextToken !== undefined && result.nextToken !== null) {
                    queryParams.nextToken = result.nextToken;
                    getAllPromisesHelper (get(path, transform, queryParams, storageSystemId, null, null, resourcesKey),
                        finalResult, deferred, path, transform, queryParams, storageSystemId, resourcesKey);
                } else {
                    deferred.resolve(finalResult);
                }
            });
        }
        function getAllPromises(token, path, isFirstCall, storageSystemId, transform, deferred, resourcesKey) {
            if(!deferred){
                deferred = $q.defer();
            }
            if (!resourcesKey) {
                resourcesKey = 'resources';
            }
            if (isFirstCall) {
                clearQuery();
            }
            var queryParams = queryService.getQueryParameters(true);
            if (token !== undefined) {
                queryParams.nextToken = token;
            }
            getAllPromisesHelper(get(path, transform, queryParams, storageSystemId, null, null, resourcesKey), [],
                deferred, path, transform, queryParams, storageSystemId, resourcesKey);
            return deferred.promise;
        }

        return {
            PAGE_SIZE: 100,
            clearQuery: clearQuery,
            EmptyResourcePage: function () {
                this.nextToken = null;
                this.resources =  [];
                this.total = 0;
            },
            QueryObject: function (key, type, value, arrayClearKey) {
                this.key = key;
                this.type = type;
                this.value = value;
                this.arrayClearKey = arrayClearKey;
            },
            SearchType: SearchType,
            getPartialSearchQueryString: getPartialSearchQueryString,
            get: function (token, path, transform, isFirstCall, storageSystemId, prefix, prefixId, queryObject) {
                if (isFirstCall) {
                    clearQuery();
                }
                $log.debug('token: ', token);

                if(queryObject) {
                    this.setFilterSearch(queryObject);
                }
                var queryParams = queryService.getQueryParameters(true);

                if (token !== undefined) {
                    queryParams.nextToken = token;
                }
                return get(path, transform, queryParams, storageSystemId, prefix, prefixId);
            },
            getAll: getAllItems,
            getQueryStringForList: getQueryStringForList,
            getAllPromises: getAllPromises,
            getQuery: function (path, transform, storageSystemId, prefix, prefixId) {
                var queryParams = queryService.getQueryParameters(true);
                queryParams.nextToken = null;
                return get(path, transform, queryParams, storageSystemId, prefix, prefixId);
            },
            setSliderSearch: function (key, start, end, unit) {
                if(unit) {
                    start = diskSizeService.createDisplaySize(start, unit).value;
                    end = diskSizeService.createDisplaySize(end, unit).value;
                }
                var value = getQueryStringForRange(start, end);
                var queryObjectInstance = queryService.getQueryObjectInstance(key, value);
                queryService.setQueryObject(queryObjectInstance);
            },
            setFilterSearch: function (queryObject) {
                if (!_.isEmpty(queryObject.value) || queryObject.type === type.ARRAY) {
                    var query = queryService.getQuery(queryObject.key);
                    if(query && queryObject.value === query.queryText) {
                        queryService.removeQueryMapEntry(queryObject.key);
                        return;
                    }
                    if(queryObject.type === type.ARRAY) {
                        var value = [];
                        var queryParams = [];
                        if(!_.isEmpty(queryObject.value)) {
                            value.push(queryObject.value);
                        }
                        if(query && query.queryText) {
                            queryParams = query.queryText.replace('(', '').replace(')', '').split(' OR ');
                            _.each(queryParams, function(val) {
                                if(!_.isEmpty(queryObject.value) || val !== queryObject.arrayClearKey) {
                                    value.push(val);
                                }
                            });
                        }
                        queryObject.value = getQueryStringForList(value);
                    }
                    var queryObjectInstance = queryService.getQueryObjectInstance(queryObject.key, queryObject.value);
                    queryService.setQueryObject(queryObjectInstance);
                } else {
                    queryService.removeQueryMapEntry(queryObject.key);
                }
            },
            setTextSearch: function (queryObjects) {
                var value = _.first(queryObjects).value;
                if (_.isEmpty(value)) {
                    queryService.removeQueryMapEntry('textSearch');
                } else {
                    var queryObject = queryService.getQueryObjectInstance('textSearch', value);
                    queryObject.queryStringFunction = function() {
                        var listOfSearch = [];
                        _.each(queryObjects, function(qo) {
                            if ((parseInt(qo.value) && qo.type === type.INT ) || qo.value === '0') {
                                listOfSearch.push(qo.key + ':' + parseInt(qo.value));
                            } else if (qo.type === type.STRING) {
                                listOfSearch.push(qo.key + ':' + getPartialSearchQueryString(qo.value));
                            }
                        });
                        return listOfSearch;
                    };
                    queryService.setQueryObject(queryObject);
                }
            },
            addSearchParameter: function (queryObject) {
                queryService.setQueryMapEntry(queryObject.key, queryObject.value);
            },
            setExistenceSearch: function (queryObject) {
                if (queryObject.type === type.MISSING || queryObject.type === type.EXISTING) {
                    var query = queryService.getQuery(queryObject.key);
                    if (query) {
                        queryService.removeQueryMapEntry(queryObject.key);
                    }
                    var isExist = (queryObject.type === type.EXISTING);
                    queryObject = queryService.getQueryObjectInstance(queryObject.key, null);
                    queryObject.queryStringFunction = function() {
                        if (isExist) {
                            return ['_exists_:' + queryObject.queryKey];
                        } else {
                            return ['_missing_:' + queryObject.queryKey];
                        }
                    };
                    queryService.setQueryObject(queryObject);
                } else {
                    queryService.removeQueryMapEntry(queryObject.key);
                }
            }
        };
    });