'use strict';

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');

    var isWindows = process.platform === 'win32';

    var app;

    var backupDefaultBrand = 'hitachi';
    var trackerFileName = '.copied';

    var isFunction = function(input){
        if (!input){
            return false;
        }

        return (typeof input === 'function');
    };

    var getBackupFolderPath = function(options){
        var backupFolderPath = options.backupFolder;

        if (!backupFolderPath){
            backupFolderPath = '.backupBranding';
        }

        return backupFolderPath;
    };


    var strippedRootFromPath = function(filePath){
        var segments = filePath.split('/');

        var path = filePath;
        if (segments.length > 1){
            segments.splice(0, 1);
            path = segments.join('/');
        }

        return path
    };


    var copyFile = function(srcFilePath, destFilePath){

        if (isFunction(destFilePath)){
            destFilePath = destFilePath(srcFilePath);
        }
        grunt.file.copy(srcFilePath, destFilePath);
    };

    var endsWith = function(input, expected){
        if (!input || !expected){
            return false;
        }

        return input.substring(input.length - expected.length) === expected;
    };

    /**
     * Correct the path symbol base on OS
     * Windows: c:\files\files.txt => will be changed to c:/files/files.txt
     * Linux: /path/file => remains unchanged.
     * @param path
     * @returns {*}
     */
    var updatePathBaseOnOS = function(path){
        if (isWindows){
            return path.replace(/\\/g, '/');
        } else {
            return path;
        }
    };

    /**
     * Concat given root path and subpath into complete path
     * This method also correct the path symbol based on OS.
     * @param rootPath
     * @param filePath
     * @returns {*}
     */
    var constructPath = function(rootPath, filePath){
        if(rootPath === undefined){
            rootPath = '';
        }
        else if (!endsWith(rootPath, '/')){
            rootPath = rootPath + '/';
        }

        return updatePathBaseOnOS(rootPath + filePath);
    };

    grunt.registerMultiTask('branding', 'copy necessary branding files', function(){

        var processFiles = function(rootFolder, processorFn){
            grunt.file.recurse(rootFolder, function(abspath, rootdir, subdir, filename) {
                if (!processorFn || !isFunction(processorFn)){
                    return;
                }

                processorFn(abspath, rootdir, subdir, filename);
            });
        };


        /**
         * filePath is the file location inside brand folder. For instance, if the file is store in app/branding/somebrand/i18n/translation.json,
         * then the filePath will be 'i18n/translation.json'
         * @param filePath
         * @param backupFolderPath
         */
        var backupFileIfNecessary = function(filePath, appPath, backupFolderPath){
            var filePathToCopy = constructPath(appPath, filePath);

            if (!grunt.file.exists(filePathToCopy)){
                return;
            }

            copyFile(filePathToCopy, function(srcFilePath) {
                //strip the rootFolder from src file
                var srcFileSubPath = strippedRootFromPath(srcFilePath);
                var destFilePath = constructPath(backupFolderPath, srcFileSubPath);

                return destFilePath;
            });
        };

        /**
         * filePath is the file location inside brand folder. For instance, if the file is store in app/branding/somebrand/i18n/translation.json,
         * then the filePath will be 'i18n/translation.json'
         * @param filePath
         * @param trackingList
         */
        var trackCopyFile = function(filePath, trackingList){
            trackingList.push(filePath);
        };


        /**
         * filePath is the file location inside brand folder. For instance, if the file is store in app/branding/somebrand/i18n/translation.json,
         * then the abspath will be 'app/branding/somebrand/i18n/translation.json', the destFilePath will be 'app/i18n/translation.json'
         * @param abspath
         * @param destFilePath
         */
        var copyBrandFiles = function(abspath, destFilePath){
            copyFile(abspath, destFilePath);
        };

        var mergeJson = function(overrideJson, originalJson, destFilePath) {
            var overrides = grunt.file.readJSON(overrideJson);
            var original = grunt.file.readJSON(originalJson);
            for (var attr in overrides) {
              original[attr] = overrides[attr];
            }
            grunt.file.write(destFilePath, JSON.stringify(original, null, 2));
        };

        /**
         * Read the file which keeps track all the copied branding files, and remove them from the main App
         * @param appPath
         * @param trackerFilePath
         *      file which keeps track of all copied files.
         */
        var cleanUpCopiedBrandFiles = function(appPath, trackerFilePath){

            if (!grunt.file.exists(trackerFilePath)){
                return;
            }

            var copiedFiles = grunt.file.read(trackerFilePath);

            var files = copiedFiles.split('\n');
            for(var index in files){
                var fileToRemove = constructPath(appPath, files[index]);

                if (grunt.file.exists(fileToRemove)){
                    grunt.file.delete(fileToRemove);
                }
            }
        };


        /**
         * Restore will remove all the copied files, after which will copy the original files over
         * @param backupFolderPath
         * @param app
         * @param trackedCopiedFilePath
         */
        var restoreDefaultFiles = function(backupFolderPath, app, trackedCopiedFilePath) {
            cleanUpCopiedBrandFiles(app, trackedCopiedFilePath);

            if (!grunt.file.exists(backupFolderPath)){
                return;
            }

            grunt.log.writeln('restore files');
            grunt.file.recurse(backupFolderPath, function(abspath, rootdir, subdir, filename) {
                copyFile(abspath, function() {
                    //strip the rootFolder from src file
                    var filePath = constructPath(subdir, filename);
                    var destFilePath = constructPath(app, filePath);
                    return destFilePath;
                });
            });
        };

        var extractBrand = function(path){
            var segments = path.split('/');
            return segments[segments.length - 1];
        };

        var options = this.options();
        var selectedBrand = options.brand;
        app = options.app;

        //if user decide to switch brand, then we need to backup default brand.
        var backupRootFolder = getBackupFolderPath(options);        //default backup root folder: '.backupBranding'
        var backupDataFolder = constructPath(backupRootFolder, backupDefaultBrand);     //default backup brand data: '.backupBranding/hitachi/'

        //if there is no brand specified, assume restoring back to default.
        //after restore to default, we delete the backed up content.
        var trackedCopiedFilePath = constructPath(backupRootFolder, trackerFileName);

        var restore = function(){
            if (grunt.file.exists(backupDataFolder)){
                restoreDefaultFiles(backupDataFolder, app, trackedCopiedFilePath);
                grunt.file.delete(backupRootFolder);
            }
        };

        var printObj = function(obj){
            for (var prop in obj){
                grunt.log.writeln(prop);
            }
        };

        var switchBrand = function(files, requestedBrand){
            files.forEach(function(filePair) {
                filePair.src.forEach(function(brandPath){
                    var brand = extractBrand(brandPath);

                    //if the current brand is not requested brand, do nothing
                    if (requestedBrand !== brand){
                        return;
                    }
                    //first, restore all files to default (clean up any branding files and restore other files)
                    restoreDefaultFiles(backupDataFolder, app, trackedCopiedFilePath);

                    //delete the backup folder so we can reconstruct default files which will be overridden by brand files.
                    if (grunt.file.exists(backupDataFolder)){
                        grunt.file.delete(backupDataFolder);
                    }


                    var trackingFiles = [];

                    processFiles(brandPath, function(abspath, rootdir, subdir, filename){
                        var filePath = constructPath(subdir, filename);
                        filePath = updatePathBaseOnOS(filePath);

                        //if there is a default version of the given file, make a back up of it
                        backupFileIfNecessary(filePath, app, backupDataFolder);

                        //track all the files which will be overridden by branding files.
                        trackCopyFile(filePath, trackingFiles);

                        //copy the brand file to override the default file.
                        var destination = constructPath(app, filePath);
                        if (filename==='translation.json') {
                            console.log('merging translation.json');
                            mergeJson(abspath, destination, destination)
                        } else {
                            copyBrandFiles(abspath, destination);
                        }
                    });

                    //commit the list of the tracked branding files record so we can delete as restore step.
                    grunt.file.write(trackedCopiedFilePath, trackingFiles.join('\n'));


                });
            });
        };



        if (!selectedBrand || selectedBrand === 'default'){
            restore();
        }else {
            switchBrand(this.files, selectedBrand);
        }

    });

};
