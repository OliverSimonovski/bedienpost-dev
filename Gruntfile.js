module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        copy: {
            dist: {
                    files: [
                        {src: 'index.html', dest: 'dist/public_html/index.html'},
                        {src: 'retrievePhoneAuth.php', dest: 'dist/private_html/retrievePhoneAuth.php'},
                        {src: 'beheer/index.html', dest: 'dist/private_html/beheer/index.html'},
                        {src: 'beheer/setPhoneAuth.php', dest: 'dist/private_html/beheer/setPhoneAuth.php'}
                    ]
            }
        },

        'useminPrepare': {
            options: {
                dest: 'dist/public_html'
            },
            html: 'index.html'
        },

        usemin: {
            html: ['dist/public_html/index.html']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-usemin');


    grunt.registerTask('default', ['useminPrepare', 'copy', 'concat', 'uglify', 'cssmin', 'usemin']);


}