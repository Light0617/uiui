'use strict';

angular.module('rainierApp')
    .factory('storageAdvisorEmbeddedSessionService', function ($window, $modal, synchronousTranslateService,
                                                               modalDialogService, utilService) {
        return {
            getHsaeLaunchAction: function (storageSystemId) {
                return {
                    type: 'link',
                    title :'storage-system-launch-hsae',
                    onClick: function (orchestratorService) {
                        // Open a new tab with empty url
                        var redirectWindow = $window.open('', '_blank');
                        redirectWindow.document.write(synchronousTranslateService.translate('hsae-session-loading'));

                        orchestratorService.storageAdvisorEmbeddedAccessResource(storageSystemId).then(function(result){
                            redirectWindow.location.href = result.launchServletUrl;
                            if (!utilService.isNullOrUndef(result.username) && !utilService.isNullOrUndef(result.token)) {
                                redirectWindow.name =
                                    '{"username": "' + result.username + '", "token": "' + result.token  + '"}';
                            }
                        }, function (error) {
                            if (error.status === 403) {
                                redirectWindow.document.body.innerText = synchronousTranslateService.translate(
                                    'hsae-session-authenticate-error-for-html');
                                modalDialogService.showDialog('',
                                    'hsae-session-authenticate-error-for-modal', 'warning');
                            } else {
                                redirectWindow.document.body.innerText = synchronousTranslateService.translate(
                                    'hsae-session-unexpected-error-for-html');
                                modalDialogService.showDialog('', 'hsae-session-unexpected-error-for-modal', 'warning');
                            }
                        });
                    }
                };
            }
        };
    });
