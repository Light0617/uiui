'use strict';

angular.module('rainierApp')
    .factory('storageAdvisorEmbeddedSessionService', function ($window, $modal, synchronousTranslateService, modalDialogService) {
        return {
            getLaunchUrl: function (storageSystemId) {
                return {
                    type: 'link',
                    title :'storage-system-launch-hsae',
                    onClick: function (orchestratorService) {
                        // Open a new tab with empty url
                        var redirectWindow = $window.open('', '_blank');
                        redirectWindow.document.write(synchronousTranslateService.translate('hsae-session-loading'));
                        orchestratorService.storageAdvisorEmbeddedUrl(storageSystemId).then(function(result){
                            // Update the url of the opened tab with storage navigator session url
                            var url = result.launchServletUrl;
                            redirectWindow.location.href = url;
                        }, function () {
                            // Currently always show network error.
                            redirectWindow.document.body.innerText = synchronousTranslateService.translate('hsae-session-html-error');
                            modalDialogService.showDialog('', 'hsae-session-modal-error', 'warning');
                        });
                    }
                };
            }
        };
    });
