'use strict';

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerMultiTask('branding', 'copy necessary branding files', function(){
        this.files.forEach(function(filePair) {

            filePair.src.forEach(function(src){
                grunt.log.writeln("Writing");
                grunt.log.writeln(src);
            });
        });

    });

};