module.exports = function (grunt) {

    // Project configuration
    grunt.initConfig({
        uglify: {
            build: {
                files: {
                    'server.min.js': ['server.js'],
                    'client.min.js': ['client.js']
                }
            }
        }
    });

    grunt.registerTask("minifyHtml", function() {
        var fs = require("fs"),
            index, server;

        index = fs.readFileSync("index.html", "utf8");
        server = fs.readFileSync("server.min.js", "utf8");

        index = index.replace(/<script.*?script>/, '<script type="text/javascript">' + server +'</script>');

        fs.writeFileSync("index.min.html", index, "utf8");

    });

    grunt.loadNpmTasks('grunt-contrib-uglify');


    // Default task
    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', ['uglify:build', 'minifyHtml']);

};