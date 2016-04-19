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
            link: function(scope) {
                scope.authModel = {
                    logout: function() {
                        authService.logout();
                        $location.path('/login');
                    }
                };

                scope.hideOverlay = true;
                scope.username = authService.getUser().name;

                var currentPath = $location.path();
                var jobsSelected = currentPath.indexOf('/jobs') === 0;
                var monitoringSelected = currentPath.indexOf('/monitoring') === 0;

                var PRODUCT_NAME = synchronousTranslateService.translate('product-name');
                var COPY_RIGHT = synchronousTranslateService.translate('product-copy-right');

                scope.tabsModel = {
                    jobsSelected: jobsSelected,
                    dashboardSelected: !jobsSelected && !monitoringSelected,
                    monitoringSelected: monitoringSelected
                };

                function toggleOverlayContent() {
                    $('overlay').height($('html').height());
                    $('.unslider').addClass('unslider-on');
                }

                scope.versionModel = {
                    productName: PRODUCT_NAME,
                    copyRight: COPY_RIGHT,
                    versionInfo: $window.sessionStorage.getItem('versionInfo'),
                    helpOrAboutClicked: (ShareDataService.helpOrAboutClicked !== undefined && ShareDataService.helpOrAboutClicked !== null) ?
                        ShareDataService.helpOrAboutClicked : false,
                    toggleHelpContent: function() {
                        helpuiService.toggleHelpPane();
                    },
                    closeHelpContent: function() {
                        helpuiService.closeHelpPane();
                    },
                    dropDownRemove: function () {
                        document.getElementById('about').removeAttribute('data-toggle');
                    },
                    dropDownAdd: function () {
                        document.getElementById('about').setAttribute('data-toggle', 'dropdown');
                    },
                    clickOnHelpOrAbout: function () {
                        scope.versionModel.helpOrAboutClicked = true;
                        ShareDataService.helpOrAboutClicked = scope.versionModel.helpOrAboutClicked;
                    },
                    clickOnIconPre: function () {
                        if (!scope.versionModel.helpOrAboutClicked) {
                            scope.versionModel.dropDownAdd();
                        }
                    },
                    clickOnIconPost: function () {
                        if (scope.versionModel.helpOrAboutClicked) {
                            scope.versionModel.dropDownRemove();
                            scope.versionModel.helpOrAboutClicked = false;
                            ShareDataService.helpOrAboutClicked = scope.versionModel.helpOrAboutClicked;
                        }
                    },
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

                if ($window.sessionStorage.versionInfo === undefined) {
                    orchestratorService.productVersionInfo().then(function (result) {
                        $window.sessionStorage.setItem('versionInfo', result.productVersionInfo);
                        scope.versionModel.versionInfo = $window.sessionStorage.getItem('versionInfo');
                    });
                }

                scope.settingsModel = {
                    launchSnmpManager: function() {
                        $location.path('/snmp-managers');
                    },
                    security: function() {
                        $location.path('/security');
                    },
                    tierManagement: function() {
                        $location.path('/tier-management');
                    },
                    launchChangeLocalPassword: function() {
                        $location.path('/change-local-password');
                    }
                };


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
            }
        };
    });
