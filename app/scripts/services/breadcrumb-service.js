'use strict';

/**
 * @ngdoc service
 * @name rainierApp.breadcrumbService
 * @description
 * # breadcrumbService
 * Factory in the rainierApp.
 */
angular.module('rainierApp')
    .factory('breadcrumbService', function ($rootScope, $location, $route) {
        function Crumb(path, label) {
            this.label = label;
            this.path = path;
            this.peers = [];
        }

        Crumb.prototype.addPeer = function (path, label) {
            this.peers.push({
                label: label,
                path: path
            });
        };

        Crumb.prototype.isDropdown = function () {
            return (this.peers.length > 0);
        };

        var breadcrumbService = {
            breadcrumbs: [],
            paramLabel: '',
            pathForParamLabel: '',
            get: function () {
                return this.breadcrumbs;
            },
            setParamLabel: function (label) {
                this.paramLabel = label;
                this.pathForParamLabel = $location.path();
                this.generate();
            },
            generate: function () {
                var routes = $route.routes,
                    pathElements = $location.path().split('/'),
                    path = '',
                    self = this;

                var getRoute = function (route) {
                    if ($route.current) {
                        var param;
                        angular.forEach($route.current.params, function (value, key) {
                            if (route.indexOf(value) !== -1) {
                                param = value;
                                if(route.indexOf('export') !== -1){
                                    param = 'Export ' + param;
                                }
                                else if(route.indexOf('share') !== -1){
                                    param = 'Share ' + param;
                                }

                            }

                            if (param) {
                                route = route.replace(value, ':' + key);
                            }
                        });

                        return {
                            path: route,
                            param: param
                        };
                    }
                };

                if (pathElements[1] === '') {
                    delete pathElements[1];
                }

                this.breadcrumbs = [];

                angular.forEach(pathElements, function (el) {
                    var nodePath = path + ((path === '/') ? el : '/' + el);
                    var route = getRoute(nodePath);
                    if (route && routes[route.path]) {
                        var options = routes[route.path].breadcrumbOptions,
                            crumb;

                        if (options && options.labelKey) {
                            //crumb = new Crumb(nodePath, self.translations[options.labelKey]);
                            crumb = new Crumb(nodePath, options.labelKey);

                            if (options.peers) {
                                angular.forEach(options.peers, function (peer) {
                                    var peerPath = path + ((path === '/') ? peer : '/' + peer);
                                    var peerRoute = getRoute(peerPath);

                                    if (peerRoute && routes[peerRoute.path]) {
                                        var peerOptions = routes[peerRoute.path].breadcrumbOptions;

                                        if (peerOptions && peerOptions.labelKey) {
                                            //crumb.addPeer(peerPath, self.translations[peerOptions.labelKey]);
                                            crumb.addPeer(peerPath, peerOptions.labelKey);
                                        }
                                    }
                                });
                            }
                        } else {
                            if (self.paramLabel !== '' && self.pathForParamLabel === nodePath) {
                                crumb = new Crumb(nodePath, self.paramLabel);
                            } else {
                                crumb = new Crumb(nodePath, route.param);
                            }
                        }

                        self.breadcrumbs.push(crumb);
                    }

                    path = nodePath;
                });
            }
        };

        $rootScope.$on('$routeChangeSuccess', function () {
            var currentPath = $location.path();
            if (currentPath !== breadcrumbService.pathForParamLabel) {
                breadcrumbService.setParamLabel('');
            }

            breadcrumbService.generate();
        });

        breadcrumbService.generate();

        return breadcrumbService;
    });
