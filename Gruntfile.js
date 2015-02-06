module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        copy: {
            dist: {
                    files: [
                        {src: 'index.html', dest: 'dist/public_html/index.html'},
                        {src: 'img/logo.png', dest: 'dist/public_html/img/logo.png'},
                        {src: 'index-https.html', dest: 'dist/private_html/index.html'},
                        {src: 'retrievePhoneAuth.php', dest: 'dist/private_html/retrievePhoneAuth.php'},
                        {src: 'retrieveContacts.php', dest: 'dist/private_html/retrieveContacts.php'},
                        {src: 'remoteStorage.php', dest: 'dist/private_html/remoteStorage.php'},
                        {src: 'generic.php', dest: 'dist/private_html/generic.php'},
                        {src: 'beheer/index.html', dest: 'dist/private_html/beheer/index.html'},
                        {src: 'beheer/setPhoneAuth.php', dest: 'dist/private_html/beheer/setPhoneAuth.php'},
                        {src: 'beheer/index.html', dest: 'dist/private_html/beheer/index.html'},
                        {src: 'vcardImport/index.php', dest: 'dist/private_html/vcardImport/index.php'},
                        {src: 'vcardImport/.htaccess', dest: 'dist/private_html/vcardImport/.htaccess'},
                        {src: 'vcardImport/vcardImport.php', dest: 'dist/private_html/vcardImport/vcardImport.php'},
                        {src: 'vcardImport/lib/vCard.php', dest: 'dist/private_html/vcardImport/lib/vCard.php'},
                        {src: 'admin/index.php', dest: 'dist/private_html/admin/index.php'},
                        {src: 'admin/.htaccess', dest: 'dist/private_html/admin/.htaccess'},
                        {src: 'admin/StoreSnomConnection.php', dest: 'dist/private_html/admin/StoreSnomConnection.php'},
                        {src: 'admin/UseSnomConnection.php', dest: 'dist/private_html/admin/UseSnomConnection.php'}
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