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
    'ngAria'
])
.config([
    '$analyticsProvider',
    '$crumbProvider',
    '$httpProvider',
    '$locationProvider',
    '$stateProvider',
    '$urlRouterProvider',
    function (
        $analyticsProvider,
        $crumbProvider,
        $httpProvider,
        $locationProvider,
        $stateProvider,
        $urlRouterProvider
    ) {
        'use strict';

        $analyticsProvider.virtualPageviews(false);

        // Assign proper Breadcrumb name/paths
        $crumbProvider.setOptions({
            primaryState: {name:'Home', customUrl: 'http://nypl.org' }
        });

        $httpProvider.interceptors.push(nyplInterceptor);

        // uses the HTML5 History API
        $locationProvider.html5Mode(true);

        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'views/research-collections.html',
                controller: 'CollectionsCtrl',
                label: 'Research Collections',
                resolve: {
                    config: getConfig,
                    divisions: LoadDivisions
                },
                data: {
                    crumbName: 'Research Collections'
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

    }
])
.run(function ($analytics, $rootScope) {
    $rootScope.$on('$viewContentLoaded', function () {
        $analytics.pageTrack('/research-collections');
    });
});

