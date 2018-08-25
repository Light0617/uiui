'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:dp-summary-alert-panel
 * @description
 * # dpSummaryAlertPanel
 */
angular.module('rainierApp')
    .directive('dpSummaryAlertPanel', function () {
        return {
            scope: false,
            templateUrl: 'views/templates/dp-summary-alert-panel.html',
            restrict: 'E',
            controller: function ($scope, monitoringService) {

                var EXPAND_TITLE = 'Expand';
                var COLLAPSE_TITLE = 'Collapse';
                var COLLAPSED_STATE = 'collapsed';
                var EXPANDED_STATE = 'expanded';
                var COLLAPSED_ARROW_STATE = 'icon-right-arrow';
                var EXPANDED_ARROW_STATE = 'icon-left-arrow';

                $scope.CAPACITY_ID = 'capacity';
                $scope.DP_ID = 'dp';
                $scope.HARDWARE_ID = 'hardware';
                $scope.capacityPanelState = {state: COLLAPSED_STATE, title: EXPAND_TITLE, arrow: COLLAPSED_ARROW_STATE};
                $scope.dpPanelState = {state: COLLAPSED_STATE, title: EXPAND_TITLE, arrow: COLLAPSED_ARROW_STATE};
                $scope.hardwarePanelState = {state: COLLAPSED_STATE, title: EXPAND_TITLE, arrow: COLLAPSED_ARROW_STATE};

                $scope.launchMonitoringPage = function (category, alertCount) {
                    monitoringService.launchMonitoring(category, alertCount);
                } ;

                $scope.toggleAction = function (categoryId) {
                    switch (categoryId) {
                        case $scope.CAPACITY_ID:
                            toggleState($scope.capacityPanelState);
                            if ($scope.dpPanelState.state === EXPANDED_STATE) {
                                toggleState($scope.dpPanelState);
                            }
                            if ($scope.hardwarePanelState.state === EXPANDED_STATE) {
                                toggleState($scope.hardwarePanelState);
                            }
                            break;
                        case $scope.DP_ID:
                            toggleState($scope.dpPanelState);
                            if ($scope.capacityPanelState.state === EXPANDED_STATE) {
                                toggleState($scope.capacityPanelState);
                            }
                            if ($scope.hardwarePanelState.state === EXPANDED_STATE) {
                                toggleState($scope.hardwarePanelState);
                            }
                            break;
                        case $scope.HARDWARE_ID:
                            toggleState($scope.hardwarePanelState);
                            if ($scope.dpPanelState.state === EXPANDED_STATE) {
                                toggleState($scope.dpPanelState);
                            }
                            if ($scope.capacityPanelState.state === EXPANDED_STATE) {
                                toggleState($scope.capacityPanelState);
                            }
                            break;
                        default:
                    }

                };

                function toggleState(stateObj) {
                    stateObj.state = stateObj.state === COLLAPSED_STATE ? EXPANDED_STATE : COLLAPSED_STATE;
                    stateObj.title = stateObj.title === EXPAND_TITLE ? COLLAPSE_TITLE : EXPAND_TITLE;
                    stateObj.arrow = stateObj.arrow === COLLAPSED_ARROW_STATE ? EXPANDED_ARROW_STATE : COLLAPSED_ARROW_STATE;
                }

                function initView() {
                    $scope.toggleAction($scope.DP_ID);

                }

                initView();
            }

        };
    });