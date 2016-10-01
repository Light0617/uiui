'use strict';

/**
 * @ngdoc service
 * @name rainierApp.gadVolumeTypeSearchService
 * @description
 * # gadVolumeTypeSearchService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('gadVolumeTypeSearchService', function (paginationService, queryService) {

        return {
            filterQuery: function (key, value, type, arrayClearKey, filterModel) {
                var queryObject;
                // This is used when you need to use 1 click/button to query more than 1 possibilities on 1 attribute.
                if (value instanceof Array && arrayClearKey instanceof Array) {
                    for (var queryParameterIndex = 0 ; queryParameterIndex < value.length; ++queryParameterIndex) {
                        // The following two ifs are because "GAD" and ("Active primary" or "Active secondary") is querying on the same attribute.
                        // Need a way to avoid the conflicts, this's only for volume inventory page.
                        if ((filterModel.filter.gadActivePrimary || filterModel.filter.gadActiveSecondary) && key === 'gadSummary.volumeType' &&
                            (arrayClearKey[queryParameterIndex] === 'Active-Primary' || arrayClearKey[queryParameterIndex] === 'Active-Secondary')) {
                            continue;
                        }
                        queryObject =
                            new paginationService.QueryObject(key, type, value[queryParameterIndex], arrayClearKey[queryParameterIndex]);
                        paginationService.setFilterSearch(queryObject);
                    }
                    switch (filterModel.filter.previousVolumeType) {
                        case 'HDP':
                            queryObject =
                                new paginationService.QueryObject('type', undefined, 'HDP', undefined);
                            paginationService.setFilterSearch(queryObject);
                            break;
                        case 'HDT':
                            queryObject =
                                new paginationService.QueryObject('type', undefined, 'HDT', undefined);
                            paginationService.setFilterSearch(queryObject);
                            break;
                        case 'HTI':
                            queryObject =
                                new paginationService.QueryObject('type', undefined, 'HTI', undefined);
                            paginationService.setFilterSearch(queryObject);
                            break;
                    }
                } else if (key === 'type') {
                    if (!filterModel.filter.gadActivePrimary) {
                        queryObject =
                            new paginationService.QueryObject('gadSummary.volumeType', filterModel.arrayType, '', 'Active-Primary');
                        paginationService.setFilterSearch(queryObject);
                    }
                    if (!filterModel.filter.gadActiveSecondary) {
                        queryObject =
                            new paginationService.QueryObject('gadSummary.volumeType', filterModel.arrayType, '', 'Active-Secondary');
                        paginationService.setFilterSearch(queryObject);
                    }
                    queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                    paginationService.setFilterSearch(queryObject);
                } else {
                    // The following if is because "GAD" and ("Active primary" or "Active secondary") is querying on the same attribute.
                    // Need a way to avoid the conflicts, this's only for volume inventory page.
                    if (!(filterModel.filter.volumeType === 'GAD' && key === 'gadSummary.volumeType' &&
                        (arrayClearKey === 'Active-Primary' || arrayClearKey === 'Active-Secondary'))) {
                        queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                        paginationService.setFilterSearch(queryObject);
                    }
                    else {
                        if (filterModel.filter.gadActivePrimary && !filterModel.filter.gadActiveSecondary) {
                            queryObject = new paginationService.QueryObject('gadSummary.volumeType', filterModel.arrayType, '', 'Active-Secondary');
                            paginationService.setFilterSearch(queryObject);
                        }
                        else if (!filterModel.filter.gadActivePrimary && filterModel.filter.gadActiveSecondary) {
                            queryObject = new paginationService.QueryObject('gadSummary.volumeType', filterModel.arrayType, '', 'Active-Primary');
                            paginationService.setFilterSearch(queryObject);
                        }
                        else if (!filterModel.filter.gadActivePrimary && !filterModel.filter.gadActiveSecondary) {
                            queryService.removeQueryMapEntry('gadSummary.volumeType');
                            queryObject = new paginationService.QueryObject('gadSummary.volumeType', filterModel.arrayType, 'Active-Primary', 'Active-Primary');
                            paginationService.setFilterSearch(queryObject);
                            queryObject = new paginationService.QueryObject('gadSummary.volumeType', filterModel.arrayType, 'Active-Secondary', 'Active-Secondary');
                            paginationService.setFilterSearch(queryObject);
                        } else {
                            queryObject = new paginationService.QueryObject(key, type, value, arrayClearKey);
                            paginationService.setFilterSearch(queryObject);
                        }
                    }
                }
            }
        };
    });