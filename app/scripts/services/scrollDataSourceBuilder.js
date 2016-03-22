'use strict';

/**
 * @ngdoc service
 * @name rainierApp.d3service
 * @description
 * # d3service
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('scrollDataSourceBuilderService', function ($filter, $timeout) {
        var pageSize = 16;

        var expandChildren = function(scope, length) {
            if (scope.dataModel.hasOwnProperty('currentPageCount')) {
                scope.dataModel.currentPageCount += length;
            }
        };

        var updateDisplayList = function (scope, resultItems, filterName, noAdd, postProcessor) {
            var view = scope.dataModel.view;
            var search = scope.dataModel.search;
            var sort = scope.dataModel.sort;

            if (!view || !sort || !resultItems) {
                return;
            }

            var allSelected = true;
            _.forEach(resultItems, function (item) {
                if (!item.selected) {
                    allSelected = false;
                }
            });
            scope.dataModel.allItemsSelected = allSelected;

            var filteredItems = [];

            if (search) {
                filteredItems = $filter(filterName)(resultItems, search);
            }

            var startPageSize = pageSize;
            if (view === 'list') {
                startPageSize = startPageSize * 2;
            }

            if (search) {
                filteredItems = $filter('orderBy')(filteredItems, sort.field, sort.reverse);
            } else {
                filteredItems= $filter('orderBy')(resultItems, sort.field, sort.reverse);
            }

            scope.dataModel.itemCounts = {
                filtered: filteredItems.length,
                total: resultItems.length
            };


            scope.dataModel.filteredList = filteredItems;

            if (!noAdd) {
                startPageSize = startPageSize - 1;
            }
            if (_.isFunction(postProcessor)) {
                filteredItems = postProcessor(filteredItems);
            }
            if (scope.dataModel.hasOwnProperty('currentPageCount')) {
                startPageSize = scope.dataModel.currentPageCount;
            }
            scope.dataModel.displayList = _.first(filteredItems, startPageSize);

            scope.dataModel.loadMore = function () {
                _.chain(filteredItems)
                    .rest(scope.dataModel.displayList.length)
                    .first(pageSize)
                    .forEach(function (item) {
                        scope.dataModel.displayList.push(item);
                    });
                if(scope.dataModel.shouldSelectAll) {
                    scope.dataModel.toggleSelectAll();
                }
                if (scope.dataModel.hasOwnProperty('currentPageCount')) {
                    scope.dataModel.currentPageCount += pageSize;
                }
            };
        };

        return {
            expandChildren: function(scope, length) {
                expandChildren(scope, length);
            },
            setupDataLoader: function (scope, resultItems, filerName, noAdd, postProcessor) {

                var self = this;
                self.resultItems = resultItems;

                scope.$watch('dataModel.view', function () {

                    updateDisplayList(scope, self.resultItems, filerName, noAdd, postProcessor);

                }, true);
                scope.$watch('dataModel.search', function () {

                    updateDisplayList(scope, self.resultItems, filerName, noAdd, postProcessor);

                }, true);
                scope.$watch('dataModel.sort', function () {
                    updateDisplayList(scope, self.resultItems, filerName, noAdd, postProcessor);

                }, true);
                scope.$watch('dataModel.deleteActivated', function () {

                    updateDisplayList(scope, self.resultItems, filerName, noAdd, postProcessor);

                }, true);

                scope.$watch('dataModel.hiddenUpdated', function () {

                    updateDisplayList(scope, self.resultItems, filerName, noAdd, postProcessor);
                }, true);

                self.addResultItems = function (items) {
                    self.resultItems = self.resultItems.concat(items);
                    $timeout(function () {
                        updateDisplayList(scope, self.resultItems, filerName, noAdd, postProcessor);
                    });

                };

                scope.selectedCount = 0;

                scope.dataModel.getSelectedItems = function () {
                    return _.where(this.filteredList, 'selected');
                };


                scope.$watch(function () {
                    return _.size(scope.dataModel.getSelectedItems());
                }, function (size) {
                    scope.selectedCount = size;
                });

                scope.dataModel.allSelected = function () {
                    var size = _.size(this.filteredList);
                    return size > 0 && scope.selectedCount === size;
                };

                scope.dataModel.onlyOneSelected = function () {
                    return scope.selectedCount === 1;
                };

                scope.dataModel.anySelected = function () {
                    return scope.selectedCount > 0;
                };

                scope.dataModel.getSelectedCount = function () {
                    return scope.selectedCount;
                };

                scope.$watch(function () {
                    return scope.dataModel.allSelected();
                }, function (val) {
                    scope.dataModel.shouldSelectAll = val;
                });

                scope.dataModel.toggleSelectAll = function () {
                    var selected = this.shouldSelectAll || false;
                    _.forEach(this.filteredList, function (item) {
                        if(!item.disabledCheckBox) {
                            item.selected = selected;
                        }
                    });
                };

                scope.dataModel.hasSelectedItems = function () {
                    return !_.isEmpty(this.getSelectedItems());
                };

                return self;
            }
        };
    });