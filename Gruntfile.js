module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['*.js', 'public/**/*.js', 'routes/*.js']
        }
    });

    // load the plugin that provides the 'uglify' task
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // set 'uglify' as the default task
    grunt.registerTask('default', ['jshint']);
};
