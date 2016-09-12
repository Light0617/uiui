/**
 * @ngdoc directive
 * @name rainierApp.directive:wizardSvgPage
 * @description
 * # wizardSvgPage
 */

'use strict';

angular.module('rainierApp')
    .directive('wizardSvgPage', function ($timeout, d3service, wwnService) {

        var builder;
        var selectedColor = '#265cb3';
        var unselectedColor = '#c0d667';
        var highlightedColor = 'orange';
        var originalPortColor = 'black';
        var newPathColor = '#3d84f5';
        var pathPage = 'paths';

        var deleteSelected = function(pathModel){
            var i;
            var path;
            for(i = 0; i< pathModel.paths.length; i++) {
                path = pathModel.paths[i];
                if (path.selected === true){
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

        function isExistingPath(currentPath, dataModel){
            var pathIndex = parseInt(currentPath.attr('path-index'));
            return pathIndex < dataModel.pathModel.originalPathLength;
        }

        function setPathAttrs(path, dataModel, isNewPath, svg){
            var selectedPath;
            path.attr('stroke-width', 3)
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
                        line = svg.select('line[title="line-from-wwn"]');
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
                if (path.selected === true){
                    if (!pathIndex){
                        pathIndex = i;
                    } else {
                        return null;
                    }
                }
            }

            return pathIndex;
        }

        function removeOneSide(dataModel, svg, pathIndex, modifyWwn, portIndex){
            var portGroup;
            var circle;
            var cx;
            var cy;
            var line;
            var currentWwn;

            d3.select('path[path-index="' + pathIndex + '"]').remove();

            if (modifyWwn) {
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
                currentWwn = wwnService.appendColon(dataModel.pathModel.paths[pathIndex].serverWwn);
                portGroup = svg.select('g[attr-wwn="' + currentWwn + '"]');
                circle = portGroup.select('circle');
                circle.attr('stroke', selectedColor);
                cx = circle.attr('cx');
                cy = circle.attr('cy');

                line = svg.append('line')
                    .attr('title', 'line-from-wwn')
                    .attr('x1', cx)
                    .attr('y1', cy)
                    .attr('x2', parseInt(cx) + 100)
                    .attr('y2', cy)
                    .attr('attr-wwn', currentWwn)
                    .attr('path-index', pathIndex)
                    .attr('attr-port-index', portIndex)
                    .attr('stroke-dasharray', '10,10')
                    .attr('stroke-width', 2)
                    .attr('stroke', selectedColor);
            }

        }

        function finishLineToWwn(circle, line, wwnText, dataModel, svg){
            var portIndex;
            var pathIndex;
            var port;
            var portGroup;
            var path;
            portIndex = parseInt(line.attr('attr-port-index'));
            pathIndex = line.attr('path-index'); // path index of the line-from-wwn
            port = dataModel.pathModel.storagePorts[portIndex];
            svg.select('g[attr-wwn="' + wwnText + '"]')
                .select('circle')
                .attr('stroke', originalPortColor);

            path = d3.select('g[title="path-wwn-port"]')
                .append('path')
                .attr('d', function () {
                    return dataModel.pathModel.createPath(
                        parseInt(circle.attr('cx')),
                        parseInt(circle.attr('cy')),
                        parseInt(line.attr('x1')),
                        parseInt(line.attr('y1')));
                })
                .attr('path-index', pathIndex ? pathIndex : dataModel.pathModel.paths.length);
            setPathAttrs(path, dataModel, !pathIndex, svg);

            // If 'path-index' attribute is set, we are modifying a path.
            if (pathIndex){
                dataModel.pathModel.paths[pathIndex].serverWwn = wwnText;
            } else {
                dataModel.pathModel.paths.push({
                    storagePortId: port.storagePortId,
                    serverWwn: wwnText
                });
            }

            portGroup = svg.select('g[port-index="'+ portIndex +'"]');
            portGroup.select('circle:nth-child(1)')
                .attr('stroke', originalPortColor);
            portGroup.select('circle:nth-child(2)')
                .attr('fill', originalPortColor);
            line.remove();
        }

        function finishLineToPort(circle, line, port, dataModel, svg){
            var wwn;
            var pathIndex;
            var path;

            wwn = line.attr('attr-wwn');
            pathIndex = line.attr('path-index'); // path index of the line-from-wwn
            svg.select('g[attr-wwn="' + wwn + '"]')
                .select('circle')
                .attr('stroke', originalPortColor);

            path = d3.select('g[title="path-wwn-port"]')
                .append('path')
                .attr('d', function () {
                    return dataModel.pathModel.createPath(
                        parseInt(line.attr('x1')),
                        parseInt(line.attr('y1')),
                        parseInt(circle.attr('cx')),
                        parseInt(circle.attr('cy')));
                })
                .attr('path-index', pathIndex ? pathIndex : dataModel.pathModel.paths.length);
            setPathAttrs(path, dataModel, !pathIndex, svg);

            // If 'path-index' is set, we are modifying a path.
            if (pathIndex) {
                dataModel.pathModel.paths.storagePortId = port.storagePortId;
            } else {
                dataModel.pathModel.paths.push({
                    storagePortId: port.storagePortId,
                    serverWwn: wwn
                });
            }

            line.remove();
        }

        builder = {
            _buildTopologicalEditor: function (d3, svg, dataModel) {
                var circle;
                var cx;
                var cy;
                var line;
                var wwnText;
                var wwn;
                var portIndex;
                var port;
                var portGroup;
                var portIndexInLine;
                var previousPortGroup;
                var pathIndex;
                var innerCircle;
                var allPaths;
                var g;
                if (!d3.select('path[path-index]').empty()) {
                    return;
                }
                g = svg.append('g')
                    .attr('title', 'path-wwn-port');

                d3.select('body')
                    .on('keydown', function(){
                    // If "delete" or "backspace" key is clicked, delete the selected paths.
                    if (dataModel.isStepActive(pathPage) && (d3.event.keyCode === 8 || d3.event.keyCode === 46)) {
                        deleteSelected(dataModel.pathModel);
                    }
                });

                allPaths = g.selectAll('path')
                    .data(dataModel.pathModel.paths.filter(function(d){
                        return d.deleted !== true;
                    }))
                    .enter()
                    .append('path')
                    .attr('d', function (d){
                        return dataModel.pathModel.getPath(d);
                    })
                    .attr('path-index', function(d, i){
                        return i;
                    });

                setPathAttrs(allPaths, dataModel, false, svg);

                // Draw the wwn side of the new path
                svg.selectAll('g[title="server-wwn"]').on('click', function(){
                    circle = d3.select(this).select('circle');
                    wwnText = d3.select(this).select('text').text();
                    pathIndex = getPathIndexIfOnlyOneSelected(dataModel.pathModel.paths);
                    if (pathIndex !== null && wwnService.removeSymbol(wwnText) === dataModel.pathModel.paths[pathIndex].serverWwn){
                        // modify existing path.
                        // Remove the wwn side of the path.
                        removeOneSide(dataModel, svg, pathIndex, true);

                        return;
                    }

                    line = svg.select('line[title="line-from-port"]');
                    if (!line.empty()){
                        // Finish the path
                        finishLineToWwn(circle, line, wwnText, dataModel, svg);
                    } else {

                        // remove the moving line before adding one.
                        line = svg.select('line[title="line-from-wwn"]');
                        if (!line.empty()) {
                            wwn = line.attr('attr-wwn');
                            svg.select('g[attr-wwn="' + wwn + '"]')
                                .select('circle')
                                .attr('stroke', originalPortColor);
                            line.remove();
                        }

                        // Find the wwn and start the line
                        //
                        circle.attr('stroke', selectedColor);

                        cx = circle.attr('cx');
                        cy = circle.attr('cy');

                        line = svg.append('line')
                            .attr('title', 'line-from-wwn')
                            .attr('x1', cx)
                            .attr('y1', cy)
                            .attr('x2', parseInt(cx) + 100)
                            .attr('y2', cy)
                            .attr('attr-wwn', wwnText)
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

                svg.selectAll('g[title="storage-port"]')
                    .on('click', function(){
                        portGroup = d3.select(this);
                        portIndex = parseInt(portGroup.attr('port-index'));
                        port = dataModel.pathModel.storagePorts[portIndex];
                        circle = portGroup.select('circle:nth-child(1)');
                        line = svg.select('line[title="line-from-wwn"]');

                        pathIndex = getPathIndexIfOnlyOneSelected(dataModel.pathModel.paths);
                        if (pathIndex !== null && port.storagePortId === dataModel.pathModel.paths[pathIndex].storagePortId){
                            // modify existing path.
                            // First remove the port side of the path.
                            removeOneSide(dataModel, svg, pathIndex, false, portIndex);

                            return;
                        }


                        if (!line.empty()) {
                            // Finish the path
                            finishLineToPort(circle, line, port, dataModel, svg);

                        } else {
                            // create a new path

                            line = svg.select('line[title="line-from-port"]');
                            if (!line.empty()){
                                // Remove the previous line and change its port icon color
                                portIndexInLine = line.attr('attr-port-index');
                                previousPortGroup = svg.select('g[port-index="'+ portIndexInLine +'"]');
                                previousPortGroup.select('circle:nth-child(1)')
                                    .attr('stroke', originalPortColor);
                                previousPortGroup.select('circle:nth-child(2)')
                                    .attr('fill', originalPortColor);
                                line.remove();
                            }

                            circle.attr('stroke', selectedColor);
                            innerCircle = portGroup.select('circle:nth-child(2)');
                            innerCircle.attr('fill', selectedColor);
                            cx = circle.attr('cx');
                            cy = circle.attr('cy');

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

        return {
            scope: {
                dataModel: '=ngModel'
            },
            templateUrl: 'views/templates/wizard-svg-page.html',
            restrict: 'E',
            link: function postLink(scope) {
                scope.dataModel.pathModel.deleteSelected = deleteSelected;
                scope.dataModel.pathModel.selectNone = selectNone;

                d3service.d3().then(function (d3) {

                    var svg = d3.select('#topology-editor');

                    scope.$watch(function () {
                        return scope.dataModel;
                    }, function () {
                        scope.render(scope.dataModel);
                    }, true);
                    scope.render = function (dataModel) {

                        // If we don't pass any data, return out of the element
                        if (!dataModel) {
                            return;
                        }

                        builder._buildTopologicalEditor(d3, svg, dataModel);
                    };
                });
            }
        };
    });

