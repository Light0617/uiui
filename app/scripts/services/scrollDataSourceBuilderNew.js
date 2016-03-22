'use strict';

/**
 * @ngdoc service
 * @name rainierApp.scrollDataSourceBuilderServiceNew
 * @description
 * # scrollDataSourceBuilderServiceNew
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('scrollDataSourceBuilderServiceNew', function ($filter, $timeout) {
        var pageSize = 16;

        var expandChildren = function(scope, length) {
            if (scope.dataModel.hasOwnProperty('currentPageCount')) {
                scope.dataModel.currentPageCount += length;
            }
        };

        var updateDisplayList = function (scope, resultItems, filterName, noAdd) {
            var view = scope.dataModel.view;

            if (!view || !resultItems) {
                return;
            }

            var allSelected = true;
            _.forEach(resultItems, function (item) {
                if (!item.selected) {
                    allSelected = false;
                }
            });
            scope.dataModel.allItemsSelected = allSelected;

            var startPageSize = pageSize;
            if (view === 'list') {
                startPageSize = startPageSize * 2;
            }

            scope.dataModel.itemCounts = {
                filtered: scope.dataModel.displayList.length,
                total: scope.dataModel.total
            };

            scope.dataModel.filteredList = scope.dataModel.displayList;

            if (!noAdd) {
                startPageSize = startPageSize - 1;
            }
            if (scope.dataModel.hasOwnProperty('currentPageCount')) {
                startPageSize = scope.dataModel.currentPageCount;
            }

            scope.dataModel.loadMore = function () {
                if (scope.dataModel.getResources && _.isFunction(scope.dataModel.getResources) &&
                    scope.dataModel.nextToken !== null && scope.dataModel.nextToken !== undefined &&
                    !scope.dataModel.busy) {
                    scope.dataModel.busy = true;
                    scope.dataModel.getResources().then(
                        function (result) {
                            _.chain(result.resources)
                                .forEach(function (item) {
                                    scope.dataModel.displayList.push(item);
                                });
                            if (scope.dataModel.shouldSelectAll) {
                                scope.dataModel.toggleSelectAll();
                            }
                            if (scope.dataModel.hasOwnProperty('currentPageCount')) {
                                scope.dataModel.currentPageCount += pageSize;
                            }

                            scope.dataModel.nextToken = result.nextToken;

                            scope.dataModel.itemCounts.filtered = scope.dataModel.displayList.length;
                            scope.dataModel.busy =false;
                        });
                }
            };
        };

        return {
            expandChildren: function(scope, length) {
                expandChildren(scope, length);
            },
            setupDataLoader: function (scope, resultItems, filerName, noAdd) {

                var self = this;
                self.resultItems = resultItems;

                scope.$watch('dataModel.view', function () {

                    updateDisplayList(scope, self.resultItems, filerName, noAdd);

                }, true);
                scope.$watch('dataModel.deleteActivated', function () {

                    updateDisplayList(scope, self.resultItems, filerName, noAdd);

                }, true);

                scope.$watch('dataModel.hiddenUpdated', function () {

                    updateDisplayList(scope, self.resultItems, filerName, noAdd);
                }, true);

                self.addResultItems = function (items) {
                    self.resultItems = self.resultItems.concat(items);
                    $timeout(function () {
                        updateDisplayList(scope, self.resultItems, filerName, noAdd);
                    });

                };

                scope.selectedCount = 0;

                scope.dataModel.getSelectedItems = function () {
                    return _.where(this.displayList, 'selected');
                };


                scope.$watch(function () {
                    return _.size(scope.dataModel.getSelectedItems());
                }, function (size) {
                    scope.selectedCount = size;
                });

                scope.dataModel.allSelected = function () {
                    var size = _.size(this.displayList);
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
                    _.forEach(this.displayList, function (item) {
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
