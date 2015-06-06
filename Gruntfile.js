module.exports = function(grunt) {
  'use strict';
  require('matchdep').filterDev('grunt-!(cli)').forEach(grunt.loadNpmTasks);
  grunt.initConfig({
    shell: {
      xpi: {
        command: [
          'cd pluginpath',
          'cfx xpi',
          'wget --post-file=pluginname.xpi http://localhost:8888/ || echo>/dev/null'
        ].join('&&')
      }
    },
    watch: {
      xpi: {
        files: ['pluginpath/**'],
        tasks: ['shell:xpi']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');
  grunt.registerTask('default', ['watch']);
};