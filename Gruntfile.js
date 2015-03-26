/*jslint indent: 2, maxlen: 80 */
/*globals module */

module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    researchinator: 
" ____                               _     _             _\n" +
" |  _ \\ ___  ___  ___  __ _ _ __ ___| |__ (_)_ __   __ _| |_ ___  _ __\n" +
" | |_) / _ \\/ __|/ _ \\/ _` | '__/ __| '_ \\| | '_ \\ / _` | __/ _ \\| '__|\n" +
" |  _ <  __/\\__ \\  __/ (_| | | | (__| | | | | | | | (_| | || (_) | |\n" +
" |_| \\_\\___||___/\\___|\\__,_|_|  \\___|_| |_|_|_| |_|\\__,_|\\__\\___/|_|\n",
    jsdoc: {
      dist: {
        src: ['public/scripts/services/*.js',
          'public/scripts/components/*.js'],
        options: {
          destination: 'docs'
        }
      }
    },
    ngAnnotate: {
      researchinator: {
        files: {
          'public/dist/researchinator.annotate.js': [
            //'public/scripts/**/*.js'
            'public/scripts/app.js',
            'public/scripts/components/nypl_alerts/nypl_alerts.js',
            'public/scripts/components/nypl_breadcrumbs/*.js',
            'public/scripts/components/nypl_feedback/*.js',
            'public/scripts/components/nypl_navigation/*.js',
            'public/scripts/components/nypl_search/*.js',
            'public/scripts/components/nypl_sso/*.js',
            'public/scripts/components/nypl_coordinates.js',
            'public/scripts/components/nypl_locations_api.js',
            'public/scripts/controllers/*.js',
            'public/scripts/directives/*.js',
            'public/scripts/filters/*.js',
            'public/scripts/services/*.js'
          ]
        }
      }
    },
    uglify: {
      options: {
        banner: "/*!\n <%= researchinator %>*/\n"
      },
      dist: {
        files: {
          'public/dist/researchinator.min.js': ['public/dist/researchinator.annotate.js']
        }
      }
    },
    ngdocs: {
      options: {
        dest: 'ngdocs',
        scripts: ['public/bower_components/jquery/jquery.min.js',
          'public/bower_components/angular/angular.js',
          'public/bower_components/angular-sanitize/angular-sanitize.js',
          'public/bower_components/angular-ui-router/release/angular-ui-router.js',
          'public/bower_components/angular-mocks/angular-mocks.js',
          'public/bower_components/angular-animate/angular-animate.min.js',
          'public/bower_components/angularitics/src/angulartics.js',
          'public/bower_components/angularitics/src/angulartics-ga.js',
          'public/bower_components/angular-translate/angular-translate.js',
          'public/bower_components/underscore/underscore.js',
          'public/vendor/jquery.cookies.js',
          'public/scripts/app.js',
          'public/scripts/components/nypl_coordinates.js',
          'public/scripts/components/nypl_locations_api.js',
          'public/scripts/components/nypl_search/nypl_search.js',
          'public/scripts/components/nypl_sso/nypl_sso.js',
          'public/scripts/components/nypl_navigation/nypl_navigation.js',
          'public/scripts/components/nypl_breadcrumbs/nypl_breadcrumbs.js',
          'public/scripts/components/nypl_feedback/nypl_feedback.js',
          'public/scripts/components/nypl_alerts/nypl_alerts.js',
          'public/scripts/filters/nypl_filters.js',
          'public/scripts/controllers/locations.js',
          'public/scripts/controllers/division.js',
          'public/scripts/controllers/amenities.js',
          'public/scripts/services/nypl_geocoder_service.js',
          'public/scripts/services/nypl_utility_service.js',
          'public/scripts/services/nypl_amenities_service.js',
          'public/scripts/services/nypl_search_service.js',
          'public/scripts/directives/nypl_directives.js'],
        html5Mode: true,
        startPage: '/',
        title: 'Researchinator ngDocs',
        image: 'public/images/nypl_logo.png',
        imageLink: 'http://research-divisions.nypl.org',
        titleLink: 'http://research-divisions.nypl.org',
        bestMatch: true,
      },
      all: ['public/scripts/**/*.js']
    },
    concat: {
      options: {
      stripBanners: true,
        banner: "/*!\n <%= locinator %>*/\n",
      },
      basic_with_components: {
        src: ['public/css/research_collections.scss',
              'public/scripts/components/nypl_alerts/styles/nypl-alerts.scss'],
        dest: 'public/css/research_collections-concat.scss',
      },
    },
    sass: {
      basic: {
        options: {
          style: 'compressed'
        },
        files: {
          'public/css/research_collections.min.css': 'public/css/research_collections.scss'
        }
      },
      basic_with_components: {
        options: {
          style: 'compressed'
        },
        files: {
          'public/css/research_collections.min.css': 'public/css/research_collections-concat.scss'
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');

  grunt.registerTask('buildJS', [
    'ngAnnotate', 'uglify'
  ]);

  grunt.registerTask('sass-basic', ['sass:basic']);
  // Additional tasks to handle all Component styles
  grunt.registerTask('sass-components', [
    'concat:basic_with_components', 'sass:basic_with_components'
  ]);

  grunt.registerTask('docs', ['jsdoc']);
  grunt.registerTask('ngdocumentation', ['ngdocs']);

};