/*jslint indent: 2, maxlen: 80 */
/*globals module */

module.exports = function (config) {
  'use strict';

  config.set({
    basePath : '../../',

    files : [
      'public/bower_components/jquery/jquery.js',
      'public/bower_components/angular/angular.js',
      'public/bower_components/angular-mocks/angular-mocks.js',
      'public/bower_components/angular-sanitize/angular-sanitize.js',
      'public/bower_components/angular-aria/angular-aria.js',
      'public/bower_components/angular-ui-router/release/*.js',
      'public/bower_components/underscore/underscore.js',
      'public/bower_components/angularitics/src/angulartics.js',
      'public/bower_components/angularitics/src/angulartics-ga.js',
      'public/bower_components/angular-animate/angular-animate.js',
      'public/bower_components/newrelic-timing/newrelic-timing.min.js',
      'public/bower_components/newrelic-timing/newrelic-timing-angular.min.js',
      'public/bower_components/moment/min/moment-with-locales.min.js',
      'public/bower_components/moment-timezone/builds/moment-timezone-with-data.min.js',
      'public/scripts/app.js',
      'public/scripts/components/nypl_alerts/nypl_alerts.js',
      'public/scripts/components/nypl_breadcrumbs/*.js',
      'public/scripts/components/nypl_feedback/*.js',
      'public/scripts/components/nypl_navigation/*.js',
      'public/scripts/components/nypl_search/*.js',
      'public/scripts/components/nypl_sso/*.js',
      'public/scripts/components/*.js',
      'public/scripts/components/**/*.html',
      'public/scripts/controllers/*.js',
      'public/scripts/directives/*.js',
      'public/scripts/directives/templates/*.html',
      'public/scripts/filters/*.js',
      'public/scripts/services/*.js',
      'test/unit/**/*.js',
    ],

    exclude : [
      'public/bower_components/angular/angular-loader.js',
      'public/bower_components/angular/*.min.js',
      'angular-scenario.js',
      'public/languages/*.json'
    ],

    autoWatch : true,

    frameworks: ['jasmine-jquery', 'jasmine'],

    browsers : ['Chrome'],

    plugins : [
      'karma-jasmine-jquery',
      'karma-junit-reporter',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-script-launcher',
      'karma-jasmine',
      'karma-ng-html2js-preprocessor',
      'karma-coverage'
    ],

    reporters: ['progress', 'coverage'],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    },

    preprocessors : {
      'public/scripts/directives/templates/*.html': ['ng-html2js'],
      'public/scripts/components/**/*.html': ['ng-html2js'],
      'public/scripts/**/*.js': ['coverage']
    },
    
    coverageReporter: {
      type: 'html',
      dir: 'test/coverage/'
    },

    ngHtml2JsPreprocessor: {
      stripPrefix: 'public/',
      moduleName: 'directiveTemplates'
    }
  });
};
