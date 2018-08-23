'use strict';

/**
 * @ngdoc service
 * @name rainierApp.storageNavigatorLaunchActionService
 * @description
 * # storageNavigatorLaunchActionService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('storageNavigatorLaunchActionService',
        function ($q, $window, $modal, storageNavigatorSessionService, utilService) {
            return {
                createNavigatorLaunchAction: function(storageSystem, sessionPageScope, icon, tooltip) {
                    var isSvpLess = utilService.isNullOrUndef(storageSystem.svpIpAddress);
                    if (isSvpLess) {
                        return {};
                    }

                    var sn2Action = storageNavigatorSessionService
                        .getNavigatorSessionAction(storageSystem.storageSystemId, sessionPageScope);
                    sn2Action.icon = icon;
                    sn2Action.tooltip = tooltip;
                    sn2Action.enabled = function () {
                        return true;
                    };

                    return {'SN2': sn2Action};
                }
            };
        });
