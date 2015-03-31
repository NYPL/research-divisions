/*jslint nomen: true, indent: 4, maxlen: 80 */
/*globals angular, window, headerScripts */

// Declare an http interceptor that will signal
// the start and end of each request
// Credit: Jim Lasvin -- https://github.com/lavinjj/angularjs-spinner
function nyplInterceptor($q, $injector) {
  var $http, notificationChannel;

  return {
    request: function (config) {
      // get $http via $injector because of circular dependency problem
      $http = $http || $injector.get('$http');
      // don't send notification until all requests are complete
      if ($http.pendingRequests.length < 1) {
        // get requestNotificationChannel via $injector
        // because of circular dependency problem
        notificationChannel = notificationChannel ||
          $injector.get('requestNotificationChannel');
        // send a notification requests are complete
        notificationChannel.requestStarted();
      }
      return config;
    },
    response: function (response) {
      $http = $http || $injector.get('$http');
      // don't send notification until all requests are complete
      if ($http.pendingRequests.length < 1) {
        notificationChannel = notificationChannel ||
          $injector.get('requestNotificationChannel');
        // send a notification requests are complete
        notificationChannel.requestEnded();
      }
      return response;
    },
    responseError: function (rejection) {
      $http = $http || $injector.get('$http');
      // don't send notification until all requests are complete
      if ($http.pendingRequests.length < 1) {
        notificationChannel = notificationChannel ||
          $injector.get('requestNotificationChannel');
        // send a notification requests are complete
        notificationChannel.requestEnded();
      }
      return $q.reject(rejection);
    }
  };
}


/**
 * @ngdoc overview
 * @module nypl_research_collections
 * @name nypl_research_collections
 * @requires ngSanitize
 * @requires ui.router
 * @requires locationService
 * @requires coordinateService
 * @requires angulartics
 * @requires angulartics.google.analytics
 * @requires nyplBreadcrumbs
 * @requires nyplAlerts
 * @description
 * Research collections.
 */
angular.module('nypl_research_collections', [
  'ngSanitize',
  'ui.router',
  'ngAnimate',
  'locationService',
  'coordinateService',
  'angulartics',
  'angulartics.google.analytics',
  'nyplNavigation',
  'nyplSSO',
  'nyplBreadcrumbs',
  'nyplSearch',
  'ngAria',
  'nyplAlerts'
])
.config([
  '$analyticsProvider',
  '$crumbProvider',
  '$httpProvider',
  '$locationProvider',
  '$stateProvider',
  '$urlRouterProvider',
  '$nyplAlertsProvider',
  function (
    $analyticsProvider,
    $crumbProvider,
    $httpProvider,
    $locationProvider,
    $stateProvider,
    $urlRouterProvider,
    $nyplAlertsProvider
  ) {
    'use strict';

    $analyticsProvider.virtualPageviews(false);

    // Assign proper Breadcrumb name/paths
    $crumbProvider.setOptions({
      primaryState: {name:'Home', customUrl: 'http://nypl.org' }
    });

    // nyplAlerts required config settings
    $nyplAlertsProvider.setOptions({
      api_root: locations_cfg.config.api_root,
      api_version: locations_cfg.config.api_version
    });

    $httpProvider.interceptors.push(nyplInterceptor);

    // uses the HTML5 History API
    $locationProvider.html5Mode(true);

    $stateProvider
      .state('home', {
        url: '/?subjects&media&locations',
        reloadOnSearch: false,
        templateUrl: 'views/research-collections.html',
        controller: 'CollectionsCtrl',
        label: 'Research Divisions',
        resolve: {
          config: getConfig,
          divisions: LoadDivisions,
          params: getQueryParams
        },
        data: {
          crumbName: 'Research Divisions'
        }
      })
      .state('lost', {
        url: '/404',
        templateUrl: 'views/404.html'
      });

      $urlRouterProvider.otherwise('/');
      $urlRouterProvider.rule(function ($injector, $location) {
        var path = $location.url();

        // Remove trailing slash if found
        if (path[path.length - 1] === '/') {
          return path.slice(0, -1);
        }
      });

      function LoadDivisions(config, nyplLocationsService) {
        return nyplLocationsService
          .allDivisions()
          .then(function (data) {
            return data.divisions;
          })
          .catch(function (err) {
            throw err;
          });
      }

      function getConfig(nyplLocationsService) {
        return nyplLocationsService.getConfig();
      }

      function getQueryParams($stateParams) {
        return $stateParams;
      }
  }
])
.run(function ($analytics, $rootScope, $location) {
  $rootScope.$on('$viewContentLoaded', function () {
    $analytics.pageTrack('/research-divisions');
    $rootScope.current_url = $location.absUrl();
  });
});

