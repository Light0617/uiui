'use strict';

/**
 * @ngdoc service
 * @name rainierApp.storageNavigatorSessionService
 * @description
 * # storageNavigatorSessionService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('storageNavigatorSessionService', function ($q, $window, $modal, synchronousTranslateService) {
        var showDialog = function (title, message, type)
        {
            var defer = $q.defer();

            var modalInstance = $modal.open({
                templateUrl: 'views/templates/navigator-session-modal.html',
                windowClass: 'modal confirmation',
                backdropClass: 'modal-backdrop',
                controller: function ($scope, $modalInstance)
                {
                    $scope.title = title;
                    $scope.message = message;
                    $scope.type = type;

                    $scope.ok = function ()
                    {
                        modalInstance.close();
                        defer.resolve();
                    };

                    $scope.cancel = function ()
                    {
                        $modalInstance.dismiss();
                        defer.reject();
                    };
                }
            });

            return defer.promise;
        };

        return {
            getNavigatorSessionAction: function (storageSystemId, sessionPageScope) {
                return {
                    type: 'link',
                    title :'storage-system-launch-security',
                    onClick: function (orchestratorService) {
                        // Open a new tab with empty url
                        var redirectWindow = $window.open('', '_blank');
                        redirectWindow.document.write('Loading storage navigator...');
                        orchestratorService.storageNavigatorSession(storageSystemId, sessionPageScope).then(function(result){
                            // Update the url of the opened tab with storage navigator session url
                            var url = result.launchServletUrl + '/' + result.oneTimeKey;
                            redirectWindow.location.href = url;

                            // Open a pop-up message
                            showDialog('', 'navigator-session-message', 'information');
                        }, function (error) {
                            if (error.status === 403){
                                redirectWindow.document.body.innerText = synchronousTranslateService.translate('navigator-session-permission-html-error');
                                showDialog('', 'navigator-session-permission-modal-error', 'warning');
                            } else {
                                redirectWindow.document.body.innerText = synchronousTranslateService.translate('navigator-session-html-error');
                                showDialog('', 'navigator-session-modal-error', 'warning');
                            }
                        });
                    }
                };
            }
        };
    });