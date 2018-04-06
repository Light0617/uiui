// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2014-11-12 using
// generator-karma 0.8.3

module.exports = function(config) {
    'use strict';

    config.set({
        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // base path, that will be used to resolve files and exclude
        basePath: '../',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine', 'es6-shim'],

        // list of files / patterns to load in the browser
        files: [
            'bower_components/jquery/dist/jquery.js',
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/angular-animate/angular-animate.js',
            'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
            'bower_components/angular-cookies/angular-cookies.js',
            'bower_components/angular-messages/angular-messages.js',
            'bower_components/angular-resource/angular-resource.js',
            'bower_components/angular-route/angular-route.js',
            'bower_components/angular-sanitize/angular-sanitize.js',
            'bower_components/angular-touch/angular-touch.js',
            'bower_components/angular-translate/angular-translate.js',
            'bower_components/angular-ui-calendar/src/calendar.js',
            'bower_components/angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/affix.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/alert.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/button.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/carousel.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/collapse.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/dropdown.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/tab.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/transition.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/scrollspy.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/modal.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/tooltip.js',
            'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/popover.js',
            'bower_components/ng-tags-input/ng-tags-input.min.js',
            'bower_components/bel-ui/app/scripts/bel.js',
            'bower_components/bel-ui/app/scripts/directives/modal.js',
            'bower_components/bel-ui/app/scripts/directives/fliptile.js',
            'bower_components/bel-ui/app/scripts/directives/fill-height.js',
            'bower_components/bel-ui/app/scripts/directives/goback.js',
            'bower_components/bel-ui/app/scripts/services/locale.js',
            'bower_components/bel-ui/app/scripts/services/base64.js',
            'bower_components/bel-ui/app/scripts/services/auth.js',
            'bower_components/bel-ui/app/scripts/services/queryService.js',
            'bower_components/helpui-framework/helpuiModule.js',
            'bower_components/helpui-content/helpuiContent.js',
            'bower_components/d3/d3.js',
            'bower_components/lodash/dist/lodash.compat.js',
            'bower_components/restangular/dist/restangular.js',
            'bower_components/jquery-ui/jquery-ui.js',
            'bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
            'bower_components/ngInfiniteScroll/build/ng-infinite-scroll.js',
            'bower_components/raphael/raphael.js',
            'bower_components/bootstrap-select/dist/js/bootstrap-select.js',
            'bower_components/highlightjs/highlight.pack.js',
            'bower_components/ng-file-upload/angular-file-upload.js',
            'bower_components/papaparse/papaparse.js',
            'bower_components/angular-strap/dist/angular-strap.js',
            'bower_components/angular-strap/dist/angular-strap.tpl.js',
            'bower_components/bel-ui/app/grizzly/grizzlyApp.js',
            'bower_components/bel-ui/app/grizzly/constants.js',
            'bower_components/bel-ui/app/grizzly/grizzlyService.js',
            'bower_components/bel-ui/app/grizzly/jobs/jobsController.js',
            'bower_components/bel-ui/app/grizzly/jobs/jobDataVis.js',
            'bower_components/bel-ui/app/grizzly/jobs/details/jobDetailsController.js',
            'bower_components/bel-ui/app/mockApp/belMock.js',
            'bower_components/bel-ui/app/mockApp/jobMock.js',
            'bower_components/bel-ui/app/mockApp/mockUtils.js',
            'app/scripts/**/*.js',
            'test/spec/**/*.js'
        ],

        // list of files / patterns to exclude
        exclude: [],

        // web server port
        port: 8080,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [
            'PhantomJS'
        ],

        // Which plugins to enable
        plugins: [
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-es6-shim',
            'karma-spec-reporter'
        ],

        reporters: [
            'spec'
        ],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false,

        colors: true,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_INFO,

        // Uncomment the following lines if you are using grunt's server to run the tests
        proxies: {
          '/': 'http://localhost:9000/'
        },
        // URL root prevent conflicts with the site root
        urlRoot: '_karma_'
    });
};
