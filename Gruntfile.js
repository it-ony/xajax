module.exports = function (grunt) {

    // Project configuration
    grunt.initConfig({
        uglify: {
            options: {
                beautify: {
                    "max_line_len": 100
                }
            },
            my_target: {
                files: {
                    'client.min.js': ['client.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task
    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['uglify:my_target']);

};