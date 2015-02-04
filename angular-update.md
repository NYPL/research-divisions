# Angular 1.2 -> Angular 1.3

## Brief Overview
Upgrading from AngularJS 1.2.x to AngularJS 1.3.x helps us keep up to date with recent stable releases from the AngularJS team. There are a few new features that will immediately help us as well as features that we can use in the future.

These features can be found on their release blog post [AngularJS 1.3.0 - superluminal-nudge](http://angularjs.blogspot.com/2014/10/angularjs-130-superluminal-nudge.html).

More release notes on [Github](https://github.com/angular/angular.js/blob/master/CHANGELOG.md#130-superluminal-nudge-2014-10-13).

## Accessibility and ngAria
AngularJS 1.3 supports an accessibility module [ngAria](https://github.com/angular/angular.js/blob/master/src/ngAria/aria.js). It's a community-driven effort to improve the user experience for users with disabilities.

Resources for WAI-ARIA

* [W3C](http://www.w3.org/TR/wai-aria/)
* [ngAria src](https://github.com/angular/angular.js/blob/v1.3.x/src/ngAria/aria.js)

## Module upgrades
Updates were made to the following bower components:
* AngularJS 1.2.14 -> 1.3.12
* Angular-animate 1.2.28 -> 1.3.12
* Angular-mocks 1.2.14 -> 1.3.12

## Code Changes
* One-time binding
    - Not necessary but useful. Bind data once and removes it from the Angular watchers variable so it doesn't dirty check it throughout the app's life cycle.

    ... 
    {{term.name}}
    <!-- becomes -->
    {{::term.name}}
    ...

* Strict Dependency Injection
    - In the <html> element in the research-collections.erb file, there's a data-ng-strict-di attribute. It's suppose to help write better AngularJS code and make sure you are following the correct dependency injection practices. 
    - What we do, however, is use ngAnnotate to help with the annotations. It also has the added bonus of concatenating all of our app files before we minify it.
    - This has been removed at the moment but if it's added, then code structure needs to be discussed.
* $http Interceptors
    - The API has been changed.

    :::javascript
    function httpInterceptor($httpProvider) {
        ...
        var interceptor = ... function ($q, $injector, $location) {
            return function (promise) {
                ...
            };
        }
    }
    // Instead of returning a function with a promise,
    // the new layout returns an object with request, reponse, and other properties.
    function nyplInterceptor($q, $injector) {
        ...
        return {
            request: function (config) {
                ...
                return config;
            },
            response: function (response) {
                ...
                return response;
            },
            ...
        }
    }

    - The $httpProvider now adds interceptors through the `interceptors` property.

    :::javascript
    // Before
    $httpProvider.responseInterceptors.push(interceptor);
    // Now
    $httpProvider.interceptors.push(nyplInterceptor);

* Functions and controllers, filters, services, directives
    - Apparently, the code pattern of declaring a named function and adding it as a controller, filter, service, or directive has been declared wrong because many developers declare the functions globally. Fortunately for us, we wrap functions in a closure so we do not have this problem.

    :::javascript
    // What was declared wrong:
    function CollectionsCtrl(...) {
        ...
    }

    angular
        .module('nypl_research_collections')
        .controller('CollectionsCtlr', CollectionsCtrl);

    // We wrap everything in closures so we don't get any errors:
    (function () {
        ...
    })();



