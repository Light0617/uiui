/**
 * @ngdoc directive
 * @name rainierApp.directive:wizardSvgPage
 * @description
 * # wizardSvgPage
 */

'use strict';

angular.module('rainierApp')
    .directive('wizardSvgPage', function (
        $timeout, d3service, wwnService, attachVolumeService, orchestratorService, $modal
    ) {

        var builder;
        var selectedColor = '#00b3a2';
        var unselectedColor = '#c0d667';
        var highlightedColor = 'orange';
        var originalPortColor = 'black';
        var newPathColor = '#3d84f5';
        var pathPage = 'paths';
        var autoSelect = 'AUTO';
        var MULTI_SELECTED = -1;
        var svg;
        var linkScope;

        var deleteSelected = function(pathModel){
            var i;
            var path;
            for(i = 0; i< pathModel.paths.length; i++) {
                path = pathModel.paths[i];
                if (path.selected === true && path.deleted !== true && !path.isVsmPort){
                    path.deleted = true;
                    d3.select('path[path-index="' + i + '"]').remove();
                }
            }
        };

        var selectNone = function(dataModel){
            var i;
            var path;
            for(i = 0; i< dataModel.pathModel.paths.length; i++) {
                path = dataModel.pathModel.paths[i];
                if (path.selected === true){
                    path.selected = false;

                    var currentPath = d3.select('path[path-index="' + i + '"]');
                    if ((currentPath.attr('selected')) === 'true') {
                        currentPath.attr('selected', 'false');
                        if (isExistingPath(currentPath, dataModel)) {
                            currentPath.attr('stroke', unselectedColor);
                        } else {
                            currentPath.attr('stroke', newPathColor);
                        }
                        currentPath.selected = false;
                    }
                }
            }

        };

        function getPathMap(paths){
            var pathMap = {};
            var key;
            _.forEach(paths, function(path){
                // If the path is deleted, we should still draw the suggested path if it is overlapping with the deleted path.
                if (path.deleted === true){
                    return;
                }
                key = path.serverEndPoint + ',' + path.storagePortId;
                if (!pathMap.hasOwnProperty(key)){
                    pathMap[key] = true;
                }
            });

            return pathMap;
        }

        function showSuggest(dataModel){

            var serverIds = [];
            _.forEach(dataModel.pathModel.selectedHosts, function(server){
                serverIds.push(server.serverId);
            });
            var selectedHostModeOptions = attachVolumeService.getSelectedHostMode(dataModel);

            var autoPathSelectionPayload = {
                storageSystemId: dataModel.selectedStorageSystem.storageSystemId,
                hostMode: (dataModel.attachModel.hostMode === autoSelect) ? null : dataModel.attachModel.hostMode,
                hostModeOptions: (!selectedHostModeOptions || selectedHostModeOptions.length === 0) ? null : selectedHostModeOptions,
                serverIds: serverIds
            };
            orchestratorService.autoPathSelect(autoPathSelectionPayload).then(function(result){
                // Add the suggested paths to existing paths
                //
                var pathMap = getPathMap(dataModel.pathModel.paths);

                _.forEach(result.pathResources, function(pathResource){
                    pathResource.endPoint = pathResource.serverWwn ? pathResource.serverWwn : pathResource.iscsiInitiatorName;
                    // When the suggested path already exists in the existing path, the suggested path is not added into
                    // the dataModel.pathModel.paths.
                    if (pathMap.hasOwnProperty(pathResource.endPoint + ',' + pathResource.portId)){
                        return;
                    }

                    var endPointCoordinate = dataModel.pathModel.idCoordinates[pathResource.endPoint];
                    var portCoordinate = dataModel.pathModel.idCoordinates[pathResource.portId];

                    if(_.isUndefined(endPointCoordinate) || _.isUndefined(portCoordinate)) {
                        return;
                    }

                    var newPath = d3.select('g[title="path-endpoint-port"]')
                        .append('path')
                        .attr('d', function () {
                            return dataModel.pathModel.createPath(
                                endPointCoordinate.x,
                                endPointCoordinate.y,
                                portCoordinate.x,
                                portCoordinate.y);
                        })
                        .attr('path-index', dataModel.pathModel.paths.length);
                    setPathAttrs(newPath, dataModel, true, svg);

                    dataModel.pathModel.paths.push({
                        storagePortId: pathResource.portId,
                        serverEndPoint: pathResource.endPoint
                    });

                });

            }).finally(function(){
                dataModel.isWaiting = false;
            });

            dataModel.isWaiting = true;
        }

        function isExistingPath(currentPath, dataModel){
            var pathIndex = parseInt(currentPath.attr('path-index'));
            return pathIndex < dataModel.pathModel.originalPathLength;
        }

        function setPathAttrs(path, dataModel, isNewPath, svg){
            var selectedPath;
            path.attr('stroke-width', 5)
                .attr('stroke', isNewPath ? newPathColor : unselectedColor)
                .attr('fill', 'none')
                .on('mouseover', function () {
                    d3.select(this).attr('stroke', highlightedColor);
                })
                .on('mouseout', function () {
                    selectedPath = d3.select(this);
                    if ((selectedPath.attr('selected')) === 'true') {
                        selectedPath.attr('stroke', selectedColor);
                    } else {
                        if (isExistingPath(selectedPath, dataModel)) {
                            selectedPath.attr('stroke', unselectedColor);
                        } else {
                            selectedPath.attr('stroke', newPathColor);
                        }
                    }
                })
                .on('click', function () {
                    //If in the middle of creating/changing a path, users should not be able to select a path.
                    var line = svg.select('line[title="line-from-port"]');
                    if (!line.empty()){
                        return;
                    } else {
                        line = svg.select('line[title="line-from-endpoint"]');
                        if (!line.empty()){
                            return;
                        }
                    }

                    selectedPath = d3.select(this);
                    var pathIndex = parseInt(selectedPath.attr('path-index'));
                    var currentPath = dataModel.pathModel.paths[pathIndex];
                    if ((selectedPath.attr('selected')) !== 'true') {
                        selectedPath.attr('selected', 'true');
                        selectedPath.attr('stroke', selectedColor);
                        currentPath.selected = true;
                    } else {
                        selectedPath.attr('selected', 'false');
                        if (isExistingPath(selectedPath, dataModel)) {
                            selectedPath.attr('stroke', unselectedColor);
                        } else {
                            selectedPath.attr('stroke', newPathColor);
                        }
                        currentPath.selected = false;
                    }

                    d3.event.stopPropagation();
                });

        }

        function getPathIndexIfOnlyOneSelected(paths){
            var pathIndex = null;
            var i;
            var path;
            for (i = 0; i < paths.length; ++i){
                path = paths[i];
                if (path.selected === true && !path.deleted){
                    if (!pathIndex){
                        pathIndex = i;
                    } else {
                        return MULTI_SELECTED;
                    }
                }
            }

            return pathIndex;
        }

        function removeOneSide(dataModel, svg, pathIndex, modifyEndpoint, portIndex){
            var portGroup;
            var circle;
            var cx;
            var cy;
            var line;
            var currentEndpoint;
            if(dataModel.pathModel.paths[pathIndex].isVsmPort){
                return;
            }

            d3.select('path[path-index="' + pathIndex + '"]').remove();
            dataModel.pathModel.paths[pathIndex].selected = false;

            if (modifyEndpoint) {
                portGroup = svg.select('g[port-id="' + dataModel.pathModel.paths[pathIndex].storagePortId + '"]');
                circle = portGroup.select('circle:nth-child(2)');
                portGroup.select('circle:nth-child(1)').attr('stroke', selectedColor);
                circle.attr('fill', selectedColor);
                portIndex = parseInt(portGroup.attr('port-index'));
                cx = circle.attr('cx');
                cy = circle.attr('cy');

                line = svg.append('line')
                    .attr('title', 'line-from-port' )
                    .attr('x1', cx)
                    .attr('y1', cy)
                    .attr('x2', parseInt(cx) - 100)
                    .attr('y2', cy)
                    .attr('path-index', pathIndex)
                    .attr('attr-port-index', portIndex)
                    .attr('stroke-dasharray', '10,10')
                    .attr('stroke-width', 2)
                    .attr('stroke', selectedColor);
            } else {
                currentEndpoint = dataModel.pathModel.paths[pathIndex].serverEndPoint;
                portGroup = svg.select('g[attr-endpoint="' + currentEndpoint + '"]');
                circle = portGroup.select('circle');
                circle.attr('stroke', selectedColor);
                cx = circle.attr('cx');
                cy = circle.attr('cy');

                line = svg.append('line')
                    .attr('title', 'line-from-endpoint')
                    .attr('x1', cx)
                    .attr('y1', cy)
                    .attr('x2', parseInt(cx) + 100)
                    .attr('y2', cy)
                    .attr('attr-endpoint', currentEndpoint)
                    .attr('path-index', pathIndex)
                    .attr('attr-port-index', portIndex)
                    .attr('stroke-dasharray', '10,10')
                    .attr('stroke-width', 2)
                    .attr('stroke', selectedColor);
            }

        }

        function finishLineToEndPoint(circle, line, endPoint, scope, svg){
            var portIndex;
            var pathIndex;
            var port;
            var portGroup;
            var path;
            portIndex = parseInt(line.attr('attr-port-index'));
            pathIndex = line.attr('path-index'); // path index of the line-from-endpoint
            port = scope.dataModel.pathModel.storagePorts[portIndex];
            if (port && port.vsmPort) {
                var modelInstance = $modal.open({
                    templateUrl: 'views/templates/error-modal.html',
                    windowClass: 'modal fade confirmation',
                    backdropClass: 'modal-backdrop',
                    controller: function ($scope) {
                        $scope.error = {};
                        $scope.error.message = 'Cannot create path for ports assigned to VSM.';
                        $scope.cancel = function () {
                            modelInstance.dismiss('cancel');
                        };

                        modelInstance.result.finally(function() {
                            modelInstance.dismiss('cancel');
                        });
                    }
                });
                return;
            }

            recoverPortCircleColor(line, svg);

            path = d3.select('g[title="path-endpoint-port"]')
                .append('path')
                .attr('d', function () {
                    return scope.dataModel.pathModel.createPath(
                        parseInt(circle.attr('cx')),
                        parseInt(circle.attr('cy')),
                        parseInt(line.attr('x1')),
                        parseInt(line.attr('y1')));
                })
                .attr('path-index', pathIndex ? pathIndex : scope.dataModel.pathModel.paths.length);
            setPathAttrs(path, scope.dataModel, !pathIndex || (parseInt(pathIndex) >= scope.dataModel.pathModel.originalPathLength), svg);

            // If 'path-index' attribute is set, we are modifying a path.
            if (pathIndex){
                scope.dataModel.pathModel.paths[pathIndex].serverEndPoint = endPoint;
            } else {
                scope.dataModel.pathModel.paths.push({
                    storagePortId: port.storagePortId,
                    serverEndPoint: endPoint,
                    isVsmPort: port.vsmPort,
                    preVirtualizePayload: {
                        srcPort: endPoint,
                        targetWwn: port.wwn,
                        storagePortType: scope.dataModel.selectedType
                    }
                });

                scope.$apply();
            }

            portGroup = svg.select('g[port-index="'+ portIndex +'"]');
            portGroup.select('circle:nth-child(1)')
                .attr('stroke', originalPortColor);
            portGroup.select('circle:nth-child(2)')
                .attr('fill', originalPortColor);
            line.remove();
        }

        function finishLineToPort(circle, line, port, scope, svg){
            var endPoint;
            var pathIndex;
            var path;
            if(port.vsmPort){
                var modelInstance = $modal.open({
                    templateUrl: 'views/templates/error-modal.html',
                    windowClass: 'modal fade confirmation',
                    backdropClass: 'modal-backdrop',
                    controller: function ($scope) {
                        $scope.error = {};
                        $scope.error.message = 'Cannot create path for ports assigned to VSM.';
                        $scope.cancel = function () {
                            modelInstance.dismiss('cancel');
                        };

                        modelInstance.result.finally(function() {
                            modelInstance.dismiss('cancel');
                        });
                    }
                });
                return;
            }
            endPoint = line.attr('attr-endpoint');
            pathIndex = line.attr('path-index'); // path index of the line-from-endpoint

            recoverEndPointCircleColor(line, svg);

            path = d3.select('g[title="path-endpoint-port"]')
                .append('path')
                .attr('d', function () {
                    return scope.dataModel.pathModel.createPath(
                        parseInt(line.attr('x1')),
                        parseInt(line.attr('y1')),
                        parseInt(circle.attr('cx')),
                        parseInt(circle.attr('cy')));
                })
                .attr('path-index', pathIndex ? pathIndex : scope.dataModel.pathModel.paths.length);
            setPathAttrs(path, scope.dataModel, !pathIndex || pathIndex >= scope.dataModel.pathModel.originalPathLength, svg);

            // If 'path-index' is set, we are modifying a path.
            if (pathIndex) {
                scope.dataModel.pathModel.paths[pathIndex].storagePortId = port.storagePortId;
            } else {
                scope.dataModel.pathModel.paths.push({
                    srcStorageSystemId: port.storageSystemId,
                    storagePortId: port.storagePortId,
                    serverEndPoint: endPoint,
                    isVsmPort: port.vsmPort,
                    preVirtualizePayload: {
                        srcPort: endPoint,
                        targetWwn: port.wwn,
                        storagePortType: scope.dataModel.selectedType
                    }
                });
                scope.$apply();
            }

            line.remove();
        }

        function pathExists(dataModel, endPoint, portId, excludedIndex){
            var path;
            var i;
            for (i = 0; i < dataModel.pathModel.paths.length; ++i){
                if (excludedIndex && excludedIndex === i){
                    break;
                }
                path = dataModel.pathModel.paths[i];
                if (endPoint === path.serverEndPoint && portId === path.storagePortId && !path.deleted){
                    return true;
                }
            }

            return false;
        }

        function recoverPortCircleColor(line, svg) {
            var portIndexInLine = line.attr('attr-port-index');
            var previousPortGroup = svg.select('g[port-index="'+ portIndexInLine +'"]').select('g');
            previousPortGroup.select('circle:nth-child(1)')
                .attr('stroke', originalPortColor);
            previousPortGroup.select('circle:nth-child(2)')
                .attr('fill', originalPortColor);
            previousPortGroup = svg.select('g[port-index="'+ portIndexInLine +'"][title="storage-port"').select('g');
            previousPortGroup.select('circle:nth-child(1)')
                .attr('stroke', originalPortColor);
            previousPortGroup.select('circle:nth-child(2)')
                .attr('fill', originalPortColor);
        }

        function recoverEndPointCircleColor(line, svg) {
            var endPoint = line.attr('attr-endpoint');
            svg.select('g[attr-endpoint="' + endPoint + '"]')
                .select('circle')
                .attr('stroke', originalPortColor);
        }

        function recoverWhenClickEsc(svg, dataModel){
            var line;
            var isLineFromPort = false;
            var pathIndex;

            // If Esc key is pressed, we should cancel the previous operation.
            // If we are in the middle of creating a path, the starting line (from server end point or from port)
            // is removed. If we are in the middle of editing a path, this path is
            line = svg.select('line[title="line-from-endpoint"]');
            if (line.empty()) {
                line = svg.select('line[title="line-from-port"]');
                isLineFromPort = true;
            }
            if (!line.empty()) {
                // If we are modifying a path and in the middle of modifying the port, click Esc will
                // recover the path.
                pathIndex = line.attr('path-index');
                if (pathIndex){
                    var endPoint = dataModel.pathModel.paths[parseInt(pathIndex)].serverEndPoint;
                    var endPointCoordinate = dataModel.pathModel.idCoordinates[endPoint];
                    var portCoordinate = dataModel.pathModel.idCoordinates[dataModel.pathModel.paths[parseInt(pathIndex)].storagePortId];
                    var newPath = d3.select('g[title="path-endpoint-port"]')
                        .append('path')
                        .attr('d', function () {
                            return dataModel.pathModel.createPath(
                                endPointCoordinate.x,
                                endPointCoordinate.y,
                                portCoordinate.x,
                                portCoordinate.y);
                        })
                        .attr('path-index', pathIndex);
                    setPathAttrs(newPath, dataModel, parseInt(pathIndex) >= dataModel.pathModel.originalPathLength, svg);
                }

                // Recover the original color of the circles at the one end of the dashed line
                if (isLineFromPort) {
                    recoverPortCircleColor(line, svg);
                } else {
                    recoverEndPointCircleColor(line, svg);
                }

                // remove the dashed line
                line.remove();
            }

        }

        builder = {
            _buildTopologicalEditor: function (d3, selectedSvg, scope, redrawLines) {
                var circle;
                var cx;
                var cy;
                var line;
                var portIndex;
                var port;
                var portGroup;
                var portIndexInLine;
                var pathIndex;
                var innerCircle;
                var allPaths;
                var g;
                if (!d3.select('path[path-index]').empty()) {
                    return;
                }
                svg = selectedSvg;
                svg.attr('viewBox', '0, 0, 1000, ' + scope.dataModel.pathModel.viewBoxHeight)
                    .attr('style', 'padding-bottom: ' + scope.dataModel.pathModel.viewBoxHeight/10 + '%');
                g = svg.append('g')
                    .attr('title', 'path-endpoint-port');

                d3.select('body')
                    .on('keydown', function(){
                    // If "delete" or "backspace" key is clicked, delete the selected paths.
                    if (scope.dataModel.isStepActive(pathPage)) {
                        if (d3.event.keyCode === 8 || d3.event.keyCode === 46) {
                            deleteSelected(scope.dataModel.pathModel);
                        } else if (d3.event.keyCode === 27) {
                            // When Esc key is pressed, then ...
                            recoverWhenClickEsc(svg, scope.dataModel);
                        }
                    }
                });

                if(redrawLines) {
                    allPaths = g.selectAll('path')
                        .data(scope.dataModel.pathModel.paths.filter(function(d){
                            return d.deleted !== true;
                        }))
                    .enter()
                    .append('path')
                    .attr('d', function (d){
                        return scope.dataModel.pathModel.getPath(d);
                    })
                    .attr('path-index', function(d, i){
                        return i;
                    });
                }
                else {
                    allPaths = g.selectAll('path')
                        .data(scope.dataModel.pathModel.paths.filter(function(d){
                            return d.deleted !== true;
                        }));
                }

                setPathAttrs(allPaths, scope.dataModel, false, svg);

                // Draw the end point side of the new path
                svg.selectAll('g[title="server-endpoint"]').on('click', function(){
                    var excludedIndex;
                    circle = d3.select(this).select('circle');
                    var endPoint = d3.select(this).select('text').attr('attr-raw');
                    pathIndex = getPathIndexIfOnlyOneSelected(scope.dataModel.pathModel.paths);
                    if (pathIndex !== null) {
                        if (pathIndex !== MULTI_SELECTED && endPoint === scope.dataModel.pathModel.paths[pathIndex].serverEndPoint) {
                            // modify existing path.
                            // Remove the end point side of the path.
                            removeOneSide(scope.dataModel, svg, pathIndex, true);
                        }

                        // If one path is selected and the end point is clicked, we do nothing.
                        // If multiple paths are selected and any end point is clicked, we do nothing either.
                        return;

                    }

                    line = svg.select('line[title="line-from-port"]');
                    if (!line.empty()){
                        // If we already have the path with the selected end point and port id, we do nothing.
                        // But if we are modifying a path to its original path, we should allow it. excludedIndex is
                        // the index of the selected path which should be excluded for existence check.
                        portIndexInLine = line.attr('attr-port-index');
                        excludedIndex = line.attr('path-index');
                        if (pathExists(scope.dataModel, endPoint, scope.dataModel.pathModel.storagePorts[portIndexInLine].storagePortId, parseInt(excludedIndex))){
                            return;
                        }

                        // Finish the path
                        finishLineToEndPoint(circle, line, endPoint, scope, svg);
                    } else {
                        line = svg.select('line[title="line-from-endpoint"]');
                        if (!line.empty()) {
                            // If we are modifying a path and in the middle of modifying the port, we can't modify end point.
                            // So we just return.
                            if (line.attr('path-index')){
                                return;
                            }

                            // remove the dashed line before adding one.
                            recoverEndPointCircleColor(line, svg);

                            line.remove();
                        }

                        // Find the end point and start the line
                        //
                        circle.attr('stroke', selectedColor);

                        cx = circle.attr('cx');
                        cy = circle.attr('cy');

                        // Add "attr-endpoint" attribute so that it is easy to find which end point it is from
                        line = svg.append('line')
                            .attr('title', 'line-from-endpoint')
                            .attr('x1', cx)
                            .attr('y1', cy)
                            .attr('x2', parseInt(cx) + 100)
                            .attr('y2', cy)
                            .attr('attr-endpoint', endPoint)
                            .attr('stroke-dasharray', '10,10')
                            .attr('stroke-width', 2)
                            .attr('stroke', selectedColor);

                        // TODO: The mousemove event will conflict with the click event in the port. Need to revisit this during
                        // end-game.
                        //svg.on('mousemove', function(){
                        //    var currentCursor = d3.mouse(this);
                        //    line.attr('x2', currentCursor[0]);
                        //    line.attr('y2', currentCursor[1]);
                        //});
                    }
                });

                svg.selectAll('g[title="storage-port"]').on('click', function(){
                        var excludedIndex;
                        portGroup = d3.select(this);
                        portIndex = parseInt(portGroup.attr('port-index'));
                        port = scope.dataModel.pathModel.storagePorts[portIndex];
                        circle = portGroup.select('circle:nth-child(1)');
                        line = svg.select('line[title="line-from-endpoint"]');

                        pathIndex = getPathIndexIfOnlyOneSelected(scope.dataModel.pathModel.paths);
                        if (pathIndex !== null) {
                            if (pathIndex !== MULTI_SELECTED && port.storagePortId === scope.dataModel.pathModel.paths[pathIndex].storagePortId) {
                                // modify existing path.
                                // First remove the port side of the path.
                                removeOneSide(scope.dataModel, svg, pathIndex, false, portIndex);
                            }

                            // If one path is selected and the port is clicked, we do nothing.
                            // If multiple paths are selected and any port is clicked, we do nothing either.
                            return;
                        }


                        if (!line.empty()) {
                            // If we already have the path with the selected end point and port id, we do nothing.
                            // But if we are modifying a path to its original path, we should allow it. excludedIndex is
                            // the index of the selected path which should be excluded for existence check.
                            excludedIndex = line.attr('path-index');
                            if (pathExists(scope.dataModel, line.attr('attr-endpoint'), port.storagePortId, parseInt(excludedIndex))) {
                                return;
                            }

                            // Finish the path
                            finishLineToPort(circle, line, port, scope, svg);

                        } else {
                            // create a new path

                            line = svg.select('line[title="line-from-port"]');
                            if (!line.empty()){
                                // If we are modifying a path and in the middle of modifying the end point, we can't modify port.
                                // So we just return.
                                if (line.attr('path-index')){
                                    return;
                                }

                                // Remove the previous line and change its port icon color
                                recoverPortCircleColor(line, svg);

                                line.remove();
                            }

                            circle.attr('stroke', selectedColor);
                            innerCircle = portGroup.select('circle:nth-child(2)');
                            innerCircle.attr('fill', selectedColor);
                            cx = circle.attr('cx');
                            cy = circle.attr('cy');

                            // Add a attribute line-from-port to the added line so that it is easy to find which port it is from.
                            line = svg.append('line')
                                .attr('title', 'line-from-port')
                                .attr('x1', cx)
                                .attr('y1', cy)
                                .attr('x2', parseInt(cx) - 100)
                                .attr('y2', cy)
                                .attr('attr-port-index', portIndex)
                                .attr('stroke-dasharray', '10,10')
                                .attr('stroke-width', 2)
                                .attr('stroke', selectedColor);
                        }
                    });

            }
        };

        var ellipsis = function (str) {
            if (str.lastIndexOf('eui.') === 0 && str.length <= 20) {
                return str;
            }

            if (str.length > 16) {
                return '…' + str.slice(str.length - 16, str.length);
            }

            return str;
        };

        return {
            scope: {
                dataModel: '=ngModel',
                ellipsis: '&',
                displayWwn: '&'
            },
            templateUrl: 'views/templates/wizard-svg-page.html',
            restrict: 'E',
            link: function postLink(scope) {
                scope.displayWwn = wwnService.appendColon;
                scope.ellipsis = ellipsis;
                linkScope = scope;
                scope.dataModel.pathModel.deleteSelected = deleteSelected;
                scope.dataModel.pathModel.selectNone = selectNone;
                scope.dataModel.pathModel.showSuggest = showSuggest;
                scope.dataModel.pathModel.builder = function() {
                    d3service.d3().then(function(d3) {

                        var selectedSvg = d3.select('#topology-editor');

                        scope.$watch(function() {
                            return scope.dataModel;
                        }, function () {
                            scope.render(scope.dataModel);
                        }, true);
                        scope.render = function(dataModel) {
                            // If we don't pass any data, return out of the element
                            if (!dataModel) {
                                return;
                            }
                            if(dataModel.isVirtualizeVolume) {
                                builder._buildTopologicalEditor(d3, selectedSvg, scope);
                            }
                            else {
                                builder._buildTopologicalEditor(d3, selectedSvg, scope, true);

                            }
                        };
                    });
                };

                scope.dataModel.build = function(redrawLines) {
                    $timeout(function(){
                        d3service.d3().then(function(d3) {
                            var selectedSvg = d3.select('#topology-editor');
                            builder._buildTopologicalEditor(d3, selectedSvg, linkScope, redrawLines);
                        });
                    }, 600);
                };

                scope.dataModel.readyDefer.resolve(true);

                scope.dataModel.deleteAllLines = function(pathModel){
                    var i;
                    var path;
                    for(i = 0; i< pathModel.paths.length; i++) {
                        path = pathModel.paths[i];
                        d3.select('path[path-index="' + i + '"]').remove();
                    }
                };

                scope.dataModel.pathModel.builder();
            }
        };
    });

