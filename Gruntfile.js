module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            dev: {
                files: ['routes/*.js', 'app.js', 'public/javascripts/*.js'],
                tasks: ['jshint', 'express:dev']
            }
        },
        jshint: {
            options: {
                node: true
            },
            all: {
                src: ['*.js', 'public/**/*.js', 'routes/*.js']
            }
        },
        express: {
            dev: {
                options: {
                    script: './bin/www'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // set 'uglify' as the default task
    grunt.registerTask('default', '', function() {
        var taskList = [
            'jshint',
            'express:dev',
            'watch'
        ];
        grunt.task.run(taskList);
    });
};

// with help from stackoverflow <3
// http://stackoverflow.com/questions/25073931/gruntjs-with-grunt-nodemon-watch-and-jshint
