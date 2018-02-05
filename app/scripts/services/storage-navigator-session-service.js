'use strict';

/**
 * @ngdoc service
 * @name rainierApp.storageNavigatorSessionService
 * @description
 * # storageNavigatorSessionService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('storageNavigatorSessionService', function ($q, $window, $modal, synchronousTranslateService, modalDialogService) {
        return {
            getNavigatorSessionAction: function (storageSystemId, sessionPageScope) {
                return {
                    type: 'link',
                    title :'storage-system-launch-security',
                    onClick: function (orchestratorService) {
                        // Open a new tab with empty url
                        var redirectWindow = $window.open('', '_blank');
                        redirectWindow.document.write(synchronousTranslateService.translate('navigator-session-loding'));
                        orchestratorService.storageNavigatorSession(storageSystemId, sessionPageScope).then(function(result){
                            // Update the url of the opened tab with storage navigator session url
                            var url = result.launchServletUrl + '/' + result.oneTimeKey;
                            redirectWindow.location.href = url;

                            // Open a pop-up message if not configure encryption key
                            if (sessionPageScope !== 'encryption-keys') {
                                showDialog('', 'navigator-session-message', 'information');
                            }
                        }, function (error) {
                            if (error.status === 403) {
                                redirectWindow.document.body.innerText = synchronousTranslateService.translate('navigator-session-permission-html-error');
                                modalDialogService.showDialog('', 'navigator-session-permission-modal-error', 'warning');
                            } else {
                                redirectWindow.document.body.innerText = synchronousTranslateService.translate('navigator-session-html-error');
                                modalDialogService.showDialog('', 'navigator-session-modal-error', 'warning');
                            }
                        });
                    }
                };
            }
        };
    });
