// Generated on 2014-11-12 using generator-angular 0.10.0
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    require('./branding-switch.js')(grunt);

    grunt.loadNpmTasks('grunt-pseudolocalize');

    grunt.loadNpmTasks('grunt-include-source');

    grunt.loadNpmTasks('grunt-war');

    // Configurable paths for the application
    var appConfig = {
        root: '/',
        app: 'app',
        dist: 'dist',
        brand: 'hitachi'
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        yeoman: appConfig,

        ngconstant: {
            // Options for all targets
            options: {
                space: '  ',
                wrap: '\'use strict\';\n\n {%= __ngModule %}',
                name: 'config'
            },
            // Environment targets
            development: {
                options: {
                    dest: '<%=yeoman.app%>/scripts/config.js'
                },
                constants: {
                    ENV: {
                        name: 'development',
                        debug: true
                    },
                    BEL_UI_PATH: 'bower_components/bel-ui'
                }
            },
            production: {
                options: {
                    dest: 'app/scripts/config.js'
                },
                constants: {
                    ENV: {
                        name: 'production',
                        debug: false
                    },
                    BEL_UI_PATH: 'bower_components/bel-ui'
                }
            }
        },

        // Build a WAR (web archive) without Maven or the JVM installed
        war: {
            target: {
                /*jshint camelcase: false */
                options: {
                    war_dist_folder: '<%= yeoman.dist %>',
                    war_name: 'rainier-ui',
                    webxml_welcome: 'index.html',
                    webxml_display_name: 'HSA'
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: ['**'],
                    dest: ''
                }]
            }
        },

        includeSource: {
            options: {
                basePath: '<%= yeoman.app %>',
                baseUrl: '',
                templates: {
                    html: {
                        js: '<script src="{filePath}"></script>'
                    }
                }
            },
            index: {
                files: {
                    '<%= yeoman.app %>/index.html': '<%= yeoman.app %>/index.html'
                }
            }
        },
        // Watches files for changes and runs tasks based on the changed files
        watch: {
            mocks: {
                files: ['<%= yeoman.app %>/index.html'],
                tasks: [
                    'newer:copy:mocks',
                    'newer:includeSource:mocks'
                ]
            },
            bower: {
                files: ['bower.json'],
                tasks: ['wiredep']
            },
            js: {
                files: ['<%= yeoman.app %>/scripts/{,*/}*.js', '<%= yeoman.app %>/mocks/{,*/}*.js'],
                tasks: ['newer:jshint:all'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            },
            jsTest: {
                files: ['test/spec/{,*/}*.js'],
                tasks: ['newer:jshint:test', 'karma']
            },
            compass: {
                files: ['<%= yeoman.app %>/styles/{,*/}*.{scss,sass}'],
                tasks: ['compass:server', 'autoprefixer']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= yeoman.app %>/{,*/}*.html',
                    '.tmp/styles/{,*/}*.css',
                    '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
            }
        },

        // The actual grunt server settings
        connect: {
            proxies: [{
                context: '/v1', // the context of the data service
                host: 'localhost', // wherever the data service is running
                port: 8080, // the port that the data service is running on
                changeOrigin: true

            },
                {
                    context: '/search', // the context of the data service
                    host: 'localhost', // wherever the data service is running
                    port: 3000, // the port that the data service is running on
                    changeOrigin: true

                }],
            options: {
                port: 9090,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35728
            },

            livereload: {
                options: {
                    open: true,
                    middleware: function(connect) {
                        return [
                            proxySnippet,
                            connect.static('.tmp'),
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect.static(appConfig.app)
                        ];
                    }
                }
            },
            test: {
                options: {
                    port: 9001,
                    middleware: function(connect) {
                        return [
                            connect.static('.tmp'),
                            connect.static('test'),
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect.static(appConfig.app)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    open: true,
                    middleware: function(connect) {
                        return [
                            proxySnippet,
                            connect.static(appConfig.dist)
                        ];
                    }
                }
            }
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    'Gruntfile.js',
                    '<%= yeoman.app %>/scripts/{,*/}*.js',
                    '<%= yeoman.app %>/mocks/{,*/}*.js'

                ]
            },
            test: {
                options: {
                    jshintrc: 'test/.jshintrc'
                },
                src: ['test/spec/{,*/}*.js']
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/{,*/}*',
                        '!<%= yeoman.dist %>/.git{,*/}*'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Add vendor prefixed styles
        autoprefixer: {
            options: {
                browsers: [ 'last 2 versions', 'ie > 9' ]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/styles/',
                    src: '{,*/}*.css',
                    dest: '.tmp/styles/'
                }]
            }
        },

        // Automatically inject Bower components into the app
        wiredep: {
            app: {
                src: ['<%= yeoman.app %>/index.html'],
                ignorePath: /\.\.\/\.\.\/\.\.\//,
                exclude: ['bootstrap-select.css']
            },
            sass: {
                src: ['<%= yeoman.app %>/styles/{,*/}*.{scss,sass}'],
                exclude: ['bootstrap-sass-official']

            }
        },

        // Compiles Sass to CSS and generates necessary files if requested
        compass: {
            options: {
                sassDir: '<%= yeoman.app %>/styles',
                cssDir: '.tmp/styles',
                generatedImagesDir: '.tmp/images/generated',
                imagesDir: '<%= yeoman.app %>/images',
                javascriptsDir: '<%= yeoman.app %>/scripts',
                fontsDir: '<%= yeoman.app %>/styles/fonts',
                importPath: './bower_components',
                httpImagesPath: '/images',
                httpGeneratedImagesPath: '/images/generated',
                httpFontsPath: '/styles/fonts',
                relativeAssets: false,
                assetCacheBuster: false,
                raw: 'Sass::Script::Number.precision = 10\n'
            },
            dist: {
                options: {
                    generatedImagesDir: '<%= yeoman.dist %>/images/generated'
                }
            },
            server: {
                options: {
                    debugInfo: true
                }
            }
        },

        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
                    '<%= yeoman.dist %>/scripts/{,*/}*.js',
                    '<%= yeoman.dist %>/styles/{,*/}*.css',
                    '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                    '<%= yeoman.dist %>/styles/fonts/*'
                ]
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>',
                flow: {
                    html: {
                        steps: {
                            js: ['concat', 'uglifyjs'],
                            css: ['cssmin']
                        },
                        post: {}
                    }
                }
            }
        },

        // Performs rewrites based on filerev and the useminPrepare configuration
        usemin: {
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
            options: {
                assetsDirs: ['<%= yeoman.dist %>', '<%= yeoman.dist %>/images']
            }
        },

        // The following *-min tasks will produce minified files in the dist folder
        // By default, your `index.html`'s <!-- Usemin block --> will take care of
        // minification. These next options are pre-configured if you do not wish
        // to use the Usemin blocks.
        // cssmin: {
        //   dist: {
        //     files: {
        //       '<%= yeoman.dist %>/styles/main.css': [
        //         '.tmp/styles/{,*/}*.css'
        //       ]
        //     }
        //   }
        // },
        // uglify: {
        //   dist: {
        //     files: {
        //       '<%= yeoman.dist %>/scripts/scripts.js': [
        //         '<%= yeoman.dist %>/scripts/scripts.js'
        //       ]
        //     }
        //   }
        // },
        // concat: {
        //   dist: {}
        // },

        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg,gif}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },

        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.svg',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },

        htmlmin: {
            dist: {
                options: {
                    collapseWhitespace: true,
                    keepClosingSlash: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: ['*.html', 'views/{,*/}*.html'],
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },

        // ng-annotate tries to make the code safe for minification automatically
        // by using the Angular long form for dependency injection.
        ngAnnotate: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/concat/scripts',
                    src: ['*.js', '!oldieshim.js'],
                    dest: '.tmp/concat/scripts'
                }]
            }
        },

        // Replace Google CDN references
        cdnify: {
            dist: {
                html: ['<%= yeoman.dist %>/*.html']
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        '*.html',
                        'views/{,*/}*.html',
                        'images/{,*/}*.{png,jpg,svg}',
                        'fonts/{,*/}*.*',
                        'i18n/{,*/}*.*',
                        'swagger-scripts/{,*/}*.*'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: ['generated/*']
                }, {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/bootstrap-sass-official/assets/fonts/bootstrap/*',
                    dest: '<%= yeoman.dist %>'
                },  {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/bel-ui/app/images/{,*/}*.*',
                    dest: '<%= yeoman.dist %>'
                },
                {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/bel-ui/app/fonts/*',
                    dest: '<%= yeoman.dist %>'
                },
                {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/bel-ui/app/grizzly/**/*',
                    dest: '<%= yeoman.dist %>'
                },
                {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/bel-ui/app/templates/serversideinventoryview.html',
                    dest: '<%= yeoman.dist %>'
                }, {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/helpui-framework/views/*',
                    dest: '<%= yeoman.dist %>'
                }, {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/helpui-content/metadata/*',
                    dest: '<%= yeoman.dist %>'
                }, {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/helpui-content/html/*',
                    dest: '<%= yeoman.dist %>'
                }, {
                    expand: true,
                    cwd: '.',
                    src: 'bower_components/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
                    dest: '<%= yeoman.dist %>'
                }]
            },
            styles: {
                expand: true,
                cwd: '<%= yeoman.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            },
            index: {
                src: '<%= yeoman.app %>/index.template',
                dest: '<%= yeoman.app %>/index.html',
                options: {
                    process: function(content) {
                        return content.replace('<!-- include mock scripts -->', '');
                    }
                }
                //files: [
                //    { src: '<%= yeoman.app %>/index.template', dest: '<%= yeoman.app %>/index.html',
                //        options: {
                //            process: function(content) {
                //                return content.replace('<!-- include mock scripts -->', '');
                //            }
                //        }
                //    },
                //    { expand: true, cwd: '<%= yeoman.app %>/branding/<%= yeoman.brand %>',src: '**/*', dest: '<%= yeoman.app %>/'}
                //]
            },
            mocks: {
                src: '<%= yeoman.app %>/index.template',
                dest: '<%= yeoman.app %>/index.html',
                options: {
                    process: function(content) {
                        return content
                            .replace('rainierApp', 'rainierAppMock')
                            .replace('<!-- include mock scripts -->',
                                '<script src="bower_components/angular-mocks/angular-mocks.js"></script>' +
                                String.fromCharCode(13) +
                                '    <!-- include: "type": "js", "files": "mocks/**/*.js" -->');
                    },
                    processContentExclude: ['**/*.{png,gif,jpg,ico,psd}']
                }
                //files: [
                //    { src: '<%= yeoman.app %>/index.template', dest: '<%= yeoman.app %>/index.html'},
                //    { expand: true, cwd: '<%= yeoman.app %>/branding/<%= yeoman.brand %>',src: '**/*', dest: '<%= yeoman.app %>/'}
                //],
                //options: {
                //    process: function(content) {
                //        return content
                //            .replace('rainierApp', 'rainierAppMock')
                //            .replace('<!-- include mock scripts -->',
                //                '<script src="bower_components/angular-mocks/angular-mocks.js"></script>' +
                //                String.fromCharCode(13) +
                //                '    <!-- include: "type": "js", "files": "mocks/**/*.js" -->');
                //    }
                //}
            }
        },

        // Run some tasks in parallel to speed up the build process
        concurrent: {
            server: [
                'compass:server'
            ],
            test: [
                'compass'
            ],
            dist: [
                'compass:dist'
                /*'imagemin',
                 'svgmin'*/
            ]
        },

        // Test settings
        karma: {
            unit: {
                configFile: 'test/karma.conf.js',
                singleRun: true
            }
        },

        branding: {
            //src: '<%= yeoman.app %>/branding/*',
            src: './branding/*',
            options: {
                app: '.'
            }

        }

    });


    grunt.registerTask('switch-brand', 'branding', function(){
        var brand = grunt.option('brand');

        grunt.log.writeln('brand: ' + brand);
        grunt.config.set('branding.options.brand', brand);

        grunt.task.run([
           'branding'
        ]);
    });

    grunt.registerTask('brand','branding', function() {
        var files = grunt.config.get('branding.src');
        var brands = [];

        grunt.file.expand(files).forEach(function(file){
            var filePathSegments = file.split('/');
            var brand = filePathSegments[filePathSegments.length - 1];

            brands.push(brand);
            grunt.log.writeln(brand);
        });
    });


    var setProxy = function() {
        if (grunt.option('proxy-host')) {
            grunt.log.writeln(grunt.option('proxy-host'));
            grunt.log.writeln(grunt.option('proxy-use-https'));

            var proxyHost = grunt.option('proxy-host');
            var proxyPort = 8080;
            var proxyProtocol = 'http:';

            if (grunt.option('proxy-use-https')) {
                proxyPort = 443;
                proxyProtocol = 'https:';
            }

            var proxy = function(context, host, port, protocol) {
                return {
                    context: context,
                    host: host,
                    port: port,
                    protocol: protocol
                };
            };

            grunt.config.set('connect.proxies', [proxy('/v1', proxyHost, proxyPort, proxyProtocol)]);
        }
    };


    //var setBranding = function() {
    //    var defaultBrand = 'hitachi';
    //    var brand = grunt.option('brand');
    //
    //    if (!brand) {
    //        brand = defaultBrand;
    //    }
    //
    //    grunt.config.set('yeoman.brand', brand);
    //};

    grunt.registerTask('serve', 'start the server and preview your app, --allow-remote=true for remote access, --proxy-host=[API host], --proxy-use-https=true for https to proxy, --brand=provide a valid branch from [grunt list-brand]', function(target) {
        setProxy();

        if (grunt.option('allow-remote')) {
            grunt.config.set('connect.options.hostname', '0.0.0.0');
            grunt.config.set('connect.livereload.options.open', false);
            grunt.log.writeln('allowing remote connection, not opening local browser');
        }
        if (target === 'dist') {
            return grunt.task.run(['build', 'configureProxies', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'wiredep',
            'copy:index',
            'includeSource:index',
            'concurrent:server',
            'autoprefixer',
            'configureProxies',
            'connect:livereload',
            'ngconstant:development',
            'watch'
        ]);
    });


    grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function(target) {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve:' + target]);
    });

    grunt.registerTask('test', 'start the server and run tests, --debug opens Chrome and enables debugging, --firefox with --debug opens firefox isntead of Chrome', function() {
        if (grunt.option('debug')) {
            grunt.config.set('karma.unit.singleRun', false);
            grunt.config.set('karma.unit.browsers', [
                grunt.option('firefox') ? 'Firefox' : 'Chrome'
            ]);
        }

        grunt.task.run([
            'clean:server',
            'concurrent:test',
            'autoprefixer',
            'connect:test',
            'ngconstant:development',
            'karma'
        ]);
    });

    grunt.registerTask('servemock', 'start the server and preview shasta app with mock backend, --allow-remote=true for remote access', function() {
        grunt.log.writeln('mocking backend REST APIs');

        if (grunt.option('allow-remote')) {
            grunt.config.set('connect.options.hostname', '0.0.0.0');
            grunt.config.set('connect.livereload.options.open', false);
            grunt.log.writeln('allowing remote connection, not opening local browser');
        }

        grunt.task.run([
            'clean:server',
            'wiredep',
            'copy:mocks',
            'includeSource:index',
            'concurrent:server',
            'autoprefixer',
            'configureProxies:server',
            'connect:livereload',
            'ngconstant:development',
            'watch'
        ]);
    });

    grunt.registerTask('build', [
        'clean:dist',
        'wiredep',
        'copy:index',
        'includeSource:index',
        'useminPrepare',
        'concurrent:dist',
        'autoprefixer',
        'concat',
        'ngAnnotate',
        'copy:dist',
        'cssmin',
        'uglify',
        'filerev',
        'usemin',
        'ngconstant:production',
        'htmlmin',
        'war'
    ]);

    grunt.registerTask('default', [
        'newer:jshint',
        'test',
        'build'
    ]);


};
