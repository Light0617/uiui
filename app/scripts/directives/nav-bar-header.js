'use strict';

/**
 * @ngdoc directive
 * @name rainierApp.directive:navBarHeader
 * @description
 * # navBarHeader
 */
angular.module('rainierApp')
    .directive('navBarHeader', function(authService, $location, Restangular, $timeout, $window, $modal, $rootScope, orchestratorService, ShareDataService, synchronousTranslateService, helpuiService) {

        return {
            templateUrl: 'views/templates/nav-bar-header.html',
            restrict: 'E',
            scope: {
                hideBreadcrumb: '='
            },
            link: function(scope) {
                scope.hideOverlay = true;
                scope.username = authService.getUser().name;
                var PRODUCT_NAME = synchronousTranslateService.translate('product-name');
                var COPY_RIGHT = synchronousTranslateService.translate('product-copy-right');
                scope.pageErrors = [];

                function toggleOverlayContent() {
                    $('overlay').height($('html').height());
                    $('.unslider').addClass('unslider-on');
                }

                $rootScope.$on('pageErrorReceived', function (evt, error) {
                    $timeout(function () {
                        if (scope.pageErrors) {
                            scope.pageErrors.push(error);
                        }
                        else {
                            scope.pageErrors = [error];
                        }
                    });
                });
                $rootScope.$on('$routeChangeSuccess', function () {
                    scope.pageErrors = [];
                });

                scope.versionModel = {
                    productName: PRODUCT_NAME,
                    copyRight: COPY_RIGHT,
                    versionInfo: $window.sessionStorage.getItem('versionInfo'),
                    getCurrentYear: function() {
                        return new Date().getFullYear();
                    },
                    toggleOverlayContent: function () {
                        scope.hideOverlay = false;
                        $timeout(toggleOverlayContent, 500);
                    },
                    closeOverlayContent: function () {
                        scope.hideOverlay = true;
                        $('.unslider').removeClass('unslider-on');
                    }
                };

                if (typeof($window.sessionStorage.versionInfo) === 'undefined') {
                    orchestratorService.productVersionInfo().then(function (result) {
                        $window.sessionStorage.setItem('versionInfo', result.productVersionInfo);
                        scope.versionModel.versionInfo = $window.sessionStorage.getItem('versionInfo');
                    });
                }

                scope.ribbonModel = {
                    tabs: [
                        {
                            tabLink: '#/',
                            tabName: synchronousTranslateService.translate('common-dashboard')
                        },
                        {
                            tabLink: '#/jobs',
                            tabName: synchronousTranslateService.translate('nav-bar-header-jobs')
                        },
                        {
                            tabLink: '#/monitoring',
                            tabName: synchronousTranslateService.translate('nav-bar-header-monitoring')
                        }
                    ],
                    buttons: [
                        // Warnings
                        {
                            buttonIcon: 'icon-warning',
                            showButton: function () {
                                return scope.pageErrors.length > 0;
                            },
                            options: [
                                {
                                    optionType: 'customized',
                                    optionTemplate: function () {
                                        return 'views/templates/ribbon-warning.html';
                                    },
                                    pageErrors: scope.pageErrors
                                }
                            ]
                        },
                        // Logout button
                        {
                            buttonIcon: 'icon-user',
                            buttonTitle: scope.username,
                            options: [
                                {
                                    optionName: synchronousTranslateService.translate('nav-bar-header-username-logout'),
                                    optionAction: function () {
                                        authService.logout();
                                        helpuiService.setHelpPaneVisible(false);
                                        $location.path('/login');
                                    }
                                }
                            ]
                        },
                        // Setting button
                        {
                            buttonIcon: 'icon-settings',
                            buttonTitle: 'Settings',
                            options: [
                                {
                                    optionName: synchronousTranslateService.translate('tier-management'),
                                    optionAction: function () {
                                        $location.path('/snmp-managers');
                                    }
                                },
                                {
                                    optionName: synchronousTranslateService.translate('nav-bar-header-security'),
                                    optionAction: function () {
                                        $location.path('/security');
                                    }
                                },
                                {
                                    optionName: synchronousTranslateService.translate('nav-bar-header-settings-snmp'),
                                    optionAction: function () {
                                        $location.path('/tier-management');
                                    }
                                },
                                {
                                    optionName: synchronousTranslateService.translate('nav-bar-header-change-local-password'),
                                    optionAction: function () {
                                        $location.path('/change-local-password');
                                    }
                                }
                            ]
                        },
                        // Help and about button
                        {
                            buttonIcon: 'icon-help',
                            buttonTitle: synchronousTranslateService.translate('nav-bar-header-help-tooltip'),
                            options: [
                                {
                                    optionName: synchronousTranslateService.translate('nav-bar-header-help'),
                                    optionAction: function () {
                                        helpuiService.toggleHelpPane();
                                    }
                                },
                                {
                                    optionName: synchronousTranslateService.translate('nav-bar-header-about'),
                                    optionType: 'popup',
                                    optionTitle: synchronousTranslateService.translate('nav-bar-header-about'),
                                    optionTemplate: 'views/templates/product-version-info.html',
                                    optionDataModel: scope.versionModel
                                }
                            ]
                        },
                        // Overlay button
                        {
                            buttonIcon: 'icon-information',
                            buttonTitle: synchronousTranslateService.translate('common-information'),
                            noOptions: true,
                            buttonAction: function () {
                                scope.versionModel.toggleOverlayContent();
                            }
                        }
                    ]
                };

            }
        };
    });
