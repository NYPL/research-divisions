/*jslint nomen: true, indent: 4, maxlen: 80 */
/*globals angular, window, headerScripts */

// Declare an http interceptor that will signal
// the start and end of each request
// Credit: Jim Lasvin -- https://github.com/lavinjj/angularjs-spinner
nyplInterceptor.$inject = ["$q", "$injector"];
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

      getConfig.$inject = ["nyplLocationsService"];
      LoadDivisions.$inject = ["config", "nyplLocationsService"];
      getQueryParams.$inject = ["$stateParams"];
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
.run(["$analytics", "$rootScope", "$location", function ($analytics, $rootScope, $location) {
  $rootScope.$on('$viewContentLoaded', function () {
    $analytics.pageTrack('/research-divisions');
    $rootScope.current_url = $location.absUrl();
  });
}]);


/*jslint indent: 2, maxlen: 80, nomen: true */
/*globals $, window, console, jQuery, angular, _, moment */

(function (window, angular, undefined) {
  'use strict';

  /** @namespace $nyplAlertsProvider */
  function $nyplAlertsProvider() {
    var errors = {
        url_undefined: '$nyplAlerts: API URL could not be defined',
        api: '$nyplAlerts: Alerts API could not retrieve data'
      },
      options = {
        api_root: null,
        api_version: null
      };

    // Sets Provider options for use
    this.setOptions = function (opts) {
      angular.extend(options, opts);
    };

    this.$get = ['$http', '$q',
      function ($http, $q) {
        var provider = {};

        // Generates a correct Alerts API URL
        provider.generateApiUrl = function (host, version) {
          if (!host || !version) { return undefined; }

          var jsonCb = '?callback=JSON_CALLBACK',
            url = host + '/' + version + '/alerts' + jsonCb;

          return (host.indexOf("http://") === 0 ||
            host.indexOf("https://") === 0) ?
              url : 'http://' + url;
        };

        // Fetches API response for Alerts
        provider.getGlobalAlerts = function () {
          var defer = $q.defer(),
            url = this.generateApiUrl(options.api_root, options.api_version);

          if (!url) {
            defer.reject(errors.url_undefined);
          } else {
            $http.jsonp(url, {cache: true})
              .success(function (data) {
                defer.resolve(data.alerts);
              })
              .error(function (status) {
                defer.reject(errors.api);
              });
          }
          return defer.promise;
        };

        provider.alerts = null;
        provider.api_url = options.api_root || null;
        provider.api_version = options.api_version || null;

        return provider;
      }];
  }

  /**
   * @ngdoc service
   * @name nyplAlerts.service:nyplAlertsService
   * @requires moment
   * @description
   * NYPL Alerts Service helper methods to assist with
   * filtering, sorting, retrieving specific key->values
   * from an Alerts array of objects.
   */
  function nyplAlertsService() {
    var service = {};

    /**
     * @ngdoc function
     * @name currentAlerts
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} obj Alerts Array Objects
     * @returns {object} An array of filtered alert objects
     * @description
     *  currentAlerts filters an array of alert objects that
     *  are within the range of today's date based of the
     *  display.start/display.end properties.
     */
    service.currentAlerts = function (obj) {
      var today = moment(),
        sDate,
        eDate;

      return _.filter(obj, function (elem) {
        if (elem.display) {
          if (elem.display.start && elem.display.end) {
            sDate = moment(elem.display.start);
            eDate = moment(elem.display.end);
            if (sDate.valueOf() <= today.valueOf() &&
                eDate.valueOf() >= today.valueOf()) {
              return elem;
            }
          }
        }
      });
    };

    /**
     * @ngdoc function
     * @name currentClosingAlerts
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} obj Alerts Array Objects
     * @returns {object} An array of filtered alert objects
     * @description
     *  currentClosingAlerts filters an array of alert objects that
     *  are within the range of today's date based of the
     *  applies.start/applies.end properties (optional).
     */
    service.currentClosingAlerts = function (obj) {
      var today = moment(),
        sDate,
        eDate;

      return _.filter(obj, function (elem) {
        if (elem.applies) {
          if (elem.applies.start && elem.applies.end) {
            sDate = moment(elem.applies.start);
            eDate = moment(elem.applies.end);
            // Covers alert within today
            if (sDate.valueOf() <= today.valueOf() &&
                eDate.valueOf() >= today.valueOf()) {
              return elem;
            }
            // Covers early openings
            else if (today.toDate() === sDate.toDate() &&
                eDate.toDate() === today.toDate() && eDate.valueOf()
                >= today.valueOf()) {
              return elem;
            }
          } else if (elem.applies.start) {
            sDate = moment(elem.applies.start);
            if (sDate.valueOf() <= today.valueOf()) {
              return elem;
            }
          }
        }
      });
    };

    /**
     * @ngdoc function
     * @name currentWeekClosingAlerts
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} obj Alerts Array Objects
     * @returns {object} An array of filtered alert objects
     * @description
     *  currentWeekClosingAlerts filters an array of alert objects
     *  that include seven days from today's date based of the
     *  applies.start property.
     */
    service.currentWeekClosingAlerts = function (obj) {
      // Get the start of the day for today.
      // If you're checking today at 12pm, but there's already an alert that
      // started at 11am, the current time won't catch it.
      // If you start from the start of the day, you'll catch it.
      var today = moment().startOf('day'),
        sevenDaysFromToday = moment().add(7, 'days').startOf('day'),
        sDate;

      return _.filter(obj, function (elem) {
        if (elem.applies) {
          if (elem.applies.start) {
            sDate = moment(elem.applies.start);
            if (sevenDaysFromToday.valueOf() >= sDate.valueOf() &&
                today.valueOf() <= sDate.valueOf()) {
              return elem;
            } else if (today.valueOf() >= sDate.valueOf()) {
              return elem;
            }
          }
        }
      });
    };

    /**
     * @ngdoc function
     * @name allClosingAlerts
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} obj Alerts Array Objects
     * @returns {object} An array of filtered alert objects
     * @description
     *  allClosingAlerts filters an array of alert objects
     *  that have an applies.start property only. Date is 
     *  not taken into consideration for this filter.
     */
    service.allClosingAlerts = function (obj) {
      if (!obj) {
        return;
      }

      return _.filter(obj, function (elem) {
        if (elem.applies && elem.applies.start) {
          return elem;
        }
      });
    };

    /**
     * @ngdoc function
     * @name sortAlertsByScope
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} Alerts Array Objects
     * @returns {object} An array of alert objects
     * @description
     *  sortAlertsByScope sorts an array of alert objects
     *  by the following order 1) all 2) location 3) division.
     */
    service.sortAlertsByScope = function (obj) {
      if (!obj) { return; }

      return _.chain(obj)
        .sortBy(function (elem) {
          return elem.scope.toLowerCase() === 'all';
        })
        .sortBy(function (elem) {
          return elem.scope.toLowerCase() === 'location';
        })
        .sortBy(function (elem) {
          return elem.scope.toLowerCase() === 'division';
        })
        .value();
    };

    /**
     * @ngdoc function
     * @name removeDuplicates
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} Alerts Array Objects
     * @returns {object} An array of filtered alert objects
     * @description
     *  removeDuplicates filters an array of alert objects
     *  to remove any duplicate alerts by checking for
     *  unique alert id's and unique alert messages.
     */
    service.removeDuplicates = function (obj) {
      if (!obj) {
        return;
      }

      return _.chain(obj)
        .indexBy('id')
        .flatten()
        .uniq(function (elem) {
          if (elem.msg) {
            return elem.msg.toLowerCase();
          }
        })
        .value();
    };

    /**
     * @ngdoc function
     * @name isAlertExpired
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} Alert Start Date
     * @param {object} Alert End Date
     * @returns {boolean} True or False
     * @description
     *  isAlertExpired checks whether an alert has expired
     *  based on today's date and ensuring that it is within
     *  the range of the start and end alert dates.
     */
    service.isAlertExpired = function (startDate, endDate) {
      if (!startDate || !endDate) {
        return;
      }

      var sDate = moment(startDate),
        eDate   = moment(endDate),
        today   = moment();

      return (sDate.valueOf() <= today.valueOf() &&
        eDate.valueOf() >= today.valueOf()) ? false : true;
    };

    /**
     * @ngdoc function
     * @name filterAlerts
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} Alerts Array Objects
     * @param {object} Multiple filtering parameters
     * @returns {object} An array of filtered alert objects
     * @description
     *  filterAlerts filters an array of alert objects
     *  primarily by uniqueness. The optional parameters
     *  continue to filter the Alerts array based on the
     *  desired result
     */
    service.filterAlerts = function (obj, opts) {
      if (!obj) { return; }

      var uniqueAlerts = this.removeDuplicates(obj),
        defaults = {
          scope: opts ? (opts.scope || null) : null,
          current: opts ? (opts.current || false) : false,
          only_closings: opts ? (opts.only_closings || false) : false
        };

      // Optional scope filter
      if (defaults.scope) {
        uniqueAlerts = _.where(uniqueAlerts, {scope: defaults.scope});
      }

      // Optional filter for filtering only closings by two
      // factors 1) all 2) current
      // If enabled, should return immediately, no need to
      // filter by current
      if (defaults.only_closings === 'all') {
        uniqueAlerts = this.allClosingAlerts(uniqueAlerts);
        return uniqueAlerts;
      } else if (defaults.only_closings === 'current') {
        uniqueAlerts = this.currentClosingAlerts(uniqueAlerts);
        return uniqueAlerts;
      } else if (defaults.only_closings === 'week') {
        uniqueAlerts = this.currentWeekClosingAlerts(uniqueAlerts);
        return uniqueAlerts;
      }

      // Optional filter for current alerts that are in range
      if (defaults.current === true) {
        uniqueAlerts = this.currentAlerts(uniqueAlerts);
      }

      return uniqueAlerts;
    };

    /**
     * @ngdoc function
     * @name getHoursOrMessage
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} opts Options object
     * @returns {string} String representation of hours/message
     * @description
     *  getHoursOrMessage Checks if a branch is open, then verifies
     *  if an alert message exists. If it does, it returns the message.
     *  If no alert message exists, it returns the hours as a string.
     *  desired result
     */
    service.getHoursOrMessage = function (opts) {
      if (!opts || !opts.closedFn) {
        return;
      }

      var message = opts.message || '',
        open = opts.open || false,
        hours = opts.hours || undefined,
        hoursFn = opts.hoursFn,
        closedFn = opts.closedFn;

      // Open or closed
      if (open) {
        // Now is there an alert message?
        if (message) {
          return message;
        }

        return hoursFn(hours);
      }
      return closedFn();
    };

    /**
     * @ngdoc function
     * @name activeClosings
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} Alerts Array Object
     * @returns {boolean} True/False dependent on any current alerts
     * @description
     *  activeClosings is a boolean check that returns true if any
     *  current alerts are returned from the filter. If no alerts
     *  are returned then, false is the return value.
     */
    service.activeClosings = function (alerts) {
      var activeAlerts = this.filterAlerts(alerts, {only_closings: 'current'});
      return (activeAlerts && activeAlerts.length) ?
          true : false;
    };

    /**
     * @ngdoc function
     * @name getCurrentActiveMessage
     * @methodOf nyplAlerts.service:nyplAlertsService
     * @param {object} Alerts Array of objects
     * @returns {string} Closed for message as String
     * @description
     *  getCurrentActiveMessage obtains the first closed_for key->value
     *  of filtered current closing alerts. If no alerts are
     *  found, an empty string is returned.
     */
    service.getCurrentActiveMessage = function (alertsArr) {
      if (!alertsArr) {
        return;
      }

      var alerts = this.filterAlerts(alertsArr, {only_closings: 'current'}),
        message = _.chain(alerts)
          .pluck('closed_for')
          .first()
          .value();

      return message;
    };

    return service;
  }

  /**
   * @ngdoc directive
   * @name nyplAlerts.directive:nyplGlobalAlerts
   * @restrict E
   * @scope
   * @description
   * Global alert directive.
   */
  function nyplGlobalAlerts($rootScope) {
    return {
      restrict: 'E',
      template: "<div class='nypl-global-alerts' data-ng-if='$root.alerts.length'>" +
                  "<div data-ng-repeat='alert in $root.alerts'>" +
                    "<p data-ng-bind-html='alert.msg'></p>" +
                  "</div>" +
                "</div>",
      replace: true,
      scope: false
    };
  }
  nyplGlobalAlerts.$inject = ['$rootScope'];

  /**
   * @ngdoc directive
   * @name nyplAlerts.directive:nyplLocationAlerts
   * @restrict E
   * @scope
   * @description
   * Alert directive for individual locations and divisions.
   */
  function nyplLocationAlerts(nyplAlertsService) {
    return {
      restrict: 'E',
      template: "<div class='nypl-location-alerts' " +
                    "data-ng-if='locationAlerts.length'>" +
                  "<div data-ng-repeat='alert in locationAlerts'>" +
                    "<p data-ng-bind-html='alert.msg'></p>" +
                  "</div>" +
                "</div>",
      replace: false,
      scope: {
        alerts: '=alerts',
        type: '@'
      },
      link: function (scope, element, attrs) {
        if (scope.alerts && scope.type.length) {
          scope.locationAlerts = nyplAlertsService.filterAlerts(
            scope.alerts,
            {scope: scope.type, current: true}
          );
        }
      }
    };
  }
  nyplLocationAlerts.$inject = ['nyplAlertsService'];

  // Initialize Alerts data through Provider
  function initAlerts($nyplAlerts, $rootScope, nyplAlertsService) {
    $nyplAlerts.getGlobalAlerts().then(function (data) {
      var alerts = $rootScope.alerts || data;
      $rootScope.alerts =
        nyplAlertsService.filterAlerts(alerts, {current: true});
      $nyplAlerts.alerts = $rootScope.alerts || data;
    }).catch(function (error) {
      throw error;
    });
  }

  initAlerts.$inject = ['$nyplAlerts', '$rootScope', 'nyplAlertsService'];

  /**
   * @ngdoc overview
   * @module nyplAlerts
   * @name nyplAlerts
   * @description
   * NYPL Alerts module
   */
  angular
    .module('nyplAlerts', ['ngSanitize'])
    .provider('$nyplAlerts', $nyplAlertsProvider)
    .service('nyplAlertsService', nyplAlertsService)
    .run(initAlerts)
    .directive('nyplLocationAlerts', nyplLocationAlerts)
    .directive('nyplGlobalAlerts', nyplGlobalAlerts);

})(window, window.angular);
/*jslint indent: 2, maxlen: 80, nomen: true */
/*globals $, window, console, jQuery, angular */

(function (window, angular, undefined) {
  'use strict';
 
  /** @namespace $Crumb */
  nyplBreadcrumbs.$inject = ["$interpolate", "$state", "$crumb"];
  function $Crumb() {
    var options = {
      primaryState: {
        name: null,
        customUrl: null
      },
      secondaryState: {
        name: null,
        customUrl: null
      }
    };

    /** @function $Crumb.setOptions
     * @param {obj} opts object containing state data.
     * @returns angular.extend() with set opts
     * @description Extends the destination object dst 
     *  by copying all of the properties from the src object(s) to dst
     */
    this.setOptions = function (opts) {
      angular.extend(options, opts);
    };

    /** @function $Crumb.$get
     * @description Provider Recipe - Exposes an API for application-wide
     *  configuration that must be made before the application starts. 
     *  Used for re-usable services.
     */
    this.$get = ['$state', '$stateParams',
      function ($state, $stateParams) {
        // Add the state in the chain, if found simply return
        var addStateToChain = function (chain, state) {
          var i, len;
          for (i = 0, len = chain.length; i < len; i += 1) {
            if (chain[i].name === state.name) {
              return;
            }
          }
          // Does not support abstract states
          if (!state.abstract) {
            if (state.customUrl) {
              state.url = $state.href(state.name, $stateParams || {});
              chain.unshift(state);
            }
          }
        };

        return {
          // Adds provider custom states to chain (global scope)
          getConfigChain: function () {
            var chain = [];

            if (options.secondaryState) {
              addStateToChain(chain, options.secondaryState);
            }
            if (options.primaryState) {
              addStateToChain(chain, options.primaryState);
            }
            return chain;
          }
        };
      }];
  }

  /**
   * @ngdoc directive
   * @name nyplBreadcrumbs.directive:nyplBreadcrumbs
   * @restrict E
   * @requires $interpolate
   * @requires $state
   * @requires $crumb
   * @scope
   * @description
   * Displays a custom NYPL breadcrumbs menu.
   * @example
   * <pre>
   *  <!-- data.crumbName is set in the router configurations -->
   *  <nypl-breadcrumbs crumb-name="data.crumbName"></nypl-breadcrumbs>
   * </pre>
   */
  function nyplBreadcrumbs($interpolate, $state, $crumb) {
    return {
      restrict: 'E',
      templateUrl: 'scripts/components/nypl_breadcrumbs/nypl_breadcrumbs.html',
      scope: {
        crumbName: '@'
      },
      link: function (scope) {
        scope.breadcrumbs = [];

        /** @function nyplBreadcrumbs.getObjectValue
         * @param {string} set string variable in directive attribute
         * @param {obj} current state context object
         * @returns {string}
         * @description Given a string of the type 'object.property.property', 
         * traverse the given context (eg the current $state object) 
         * and return the value found at that path.
         * 
         */
        function getObjectValue(objectPath, context) {
          var i,
            propertyArray = objectPath.split('.'),
            propertyReference = context;

          for (i = 0; i < propertyArray.length; i += 1) {
            if (angular.isDefined(propertyReference[propertyArray[i]])) {
              propertyReference = propertyReference[propertyArray[i]];
            }
          }
          return propertyReference;
        }

        /** @function nyplBreadcrumbs.getWorkingState
        * @param {obj}
        * @returns {obj, boolean}
        * @description Get the state to put in the breadcrumbs array, 
        * taking into account that if the current state is abstract,
        * we need to either substitute it with the state named in the
        * `scope.abstractProxyProperty` property, or set it to `false`
        * which means this breadcrumb level will be skipped entirely.
        */
        function getWorkingState(currentState) {
          var proxyStateName,
            workingState = currentState;

          if (currentState.abstract === true) {
            if (typeof scope.abstractProxyProperty !== 'undefined') {
              proxyStateName = getObjectValue(scope.abstractProxyProperty, currentState);
              if (proxyStateName) {
                workingState = $state.get(proxyStateName);
              } else {
                workingState = false;
              }
            } else {
              workingState = false;
            }
          }
          return workingState;
        }

        /** @function nyplBreadcrumbs.getCrumbName
        * @param {obj}
        * @returns {string, boolean}
        * @description Resolve the name of the Breadcrumb of the specified state. 
        *  Take the property specified by the `displayname-property`
        *  attribute and look up the corresponding property 
        *  on the state's config object. The specified string can be interpolated
        */
        function getCrumbName(currentState) {
          var interpolationContext,
            propertyReference,
            displayName;

          if (!scope.crumbName) {
            // if the displayname-property attribute was not specified, 
            // default to the state's name
            return currentState.name;
          }

          propertyReference = getObjectValue(scope.crumbName, currentState);
          // use the $interpolate service to handle any bindings
          interpolationContext =  (typeof currentState.locals !== 'undefined') ? currentState.locals.globals : currentState;
            
          if (propertyReference === false) {
            return false;
          }
          else if (typeof propertyReference === 'undefined') {
            return currentState.name;
          }

          if (interpolationContext) {
            displayName = $interpolate(propertyReference)(interpolationContext);
            return displayName;
          }
        }

        /** @function nyplBreadcrumbs.getParentState
         * @param {obj}
         * @returns {obj, null}
         * @description Resolve the Parent State given from the parentState property.
         *  Extract parentState names and state ui-href properties and assign to object
         *  Utilize the currentState.parentSetting to check for validity in config
         */
        function getParentState(currentState) {
          var currState = currentState,
            parentStateSetting = currState.data.parentState,
            parentStateRoute,
            parentStateName,
            parentDivisionName,
            parentDivisionRoute,
            parentStateObj = {},
            context = (typeof currentState.locals !== 'undefined') ? currentState.locals.globals : currentState;

          if (typeof context === 'object' && parentStateSetting) {
            if (!context.$stateParams) {
              return undefined;
            }
            // Extract Parent-state properties
            parentStateName  = getParentName(currentState);
            parentStateRoute = getParentRoute(context, parentStateSetting);   

            // Extract parent division if available
            parentDivisionName  = getParentDivisionName(context); 
            parentDivisionRoute = getParentDivisionRoute(context);

            if (parentStateName && parentStateRoute) {
              // Create parent object
              parentStateObj = {
                displayName: parentStateName,
                route: parentStateRoute
              }
            }

            if (parentDivisionName && parentDivisionRoute) {
              parentStateObj.division = {
                name: parentDivisionName,
                route: parentDivisionRoute
              }
            }

            if (parentStateObj) {
              return parentStateObj;
            }
            return undefined;
          }
          return undefined;
        }

        function getParentDivisionRoute(context) {
          var currentContext = context,
            divisionState = 'division',
            parentRoute,
            parentData;

          if (typeof currentContext === 'object') {
            // Loop through context and find parent data
            Object.keys(currentContext).forEach(function(key) {
              if (key !== '$stateParams') {
                parentData = currentContext[key];
              }
            });

            // Get the slug for the parent route
            if (parentData._embedded !== undefined) {
              if (parentData._embedded.parent) {
                if (parentData._embedded.parent.slug) {
                  parentRoute = parentData._embedded.parent.slug;
                  return divisionState + 
                          '({ ' + "\"" + divisionState +
                           "\"" + ':' + "\"" + parentRoute +
                            "\"" + '})';
                }
              }
            }
            return undefined;
          }
          return undefined;
        }

        function getParentDivisionName(context) {
          var currentContext = context,
            parentName,
            parentData;

          if (typeof currentContext === 'object') {
            // Loop through context and find parent data
            Object.keys(currentContext).forEach(function(key) {
              if (key !== '$stateParams') {
                parentData = currentContext[key];
              }
            });

            // Get the slug for the parent route
            if (parentData._embedded !== undefined) {
              if (parentData._embedded.parent) {
                if (parentData._embedded.parent.name) {
                  parentName = parentData._embedded.parent.name;
                  return parentName;
                }
              }
            }
            return undefined;
          }
          return undefined;
        }

        /** @function nyplBreadcrumbs.getParentRoute
         * @param {obj}
         * @param {string}
         * @returns {obj, undefined}
         * @description Resolve the Parent route given from the parentState property.
         *  Traverse the current state context and find matches to the parent property
         */
        function getParentRoute(context, parentStateSetting) {
          var currentContext = context,
            stateSetting = parentStateSetting,
            parentRoute,
            parentData;

          if (typeof currentContext === 'object' && stateSetting) {
            // Loop through context and find parent data
            Object.keys(currentContext).forEach(function(key) {
              if (key !== '$stateParams') {
                parentData = currentContext[key];
              }
            });

            // Get the slug for the parent route
            if (parentData.amenity) {
              if (parentData.amenity.id) {
                parentRoute = parentData.amenity.id;
              }
            }
            else if (parentData._embedded) {
              if (parentData._embedded.location) {
                if (parentData._embedded.location.slug) {
                  parentRoute = parentData._embedded.location.slug;
                }
              }
            }

            if (parentRoute) {
              return stateSetting + '({ ' + "\"" +
                     stateSetting + "\"" + ':' + "\"" +
                      parentRoute + "\"" + '})';
            }
            return stateSetting;
          }
          return undefined;
        }

        /** @function nyplBreadcrumbs.getParentName
         * @param {obj}
         * @returns {string}
         * @description Resolve the Parent name from the current state
         */
        function getParentName(currentState) {
          var parentStateSetting = currentState.data.parentState,
            parentStateData = $state.get(parentStateSetting),
            context = (typeof currentState.locals !== 'undefined') ? currentState.locals.globals : currentState,
            parentStateName,
            parentData;

          if (parentStateData) {
            parentStateName = $interpolate(parentStateData.data.crumbName)(context);
            if (parentStateName) {
              return parentStateName;
            }
            // Not within the context interpolation, loop though object
            else if ( typeof context === 'object') {
              // Loop through context and find parent data
              Object.keys(context).forEach(function(key) {
                if (key !== '$stateParams') {
                  parentData = context[key];
                }
              });
              

              if (parentData.amenity) {
                if (parentData.amenity.name) {
                  parentStateName = parentData.amenity.name;
                }
              }
              else if (parentData._embedded) {
                if (parentData._embedded.location) {
                  if (parentData._embedded.location.name) {
                    parentStateName = parentData._embedded.location.name;
                  }
                }
              }

              if (parentStateName) {
                return parentStateName;
              }
              return parentStateSetting;
            }
          }
          return undefined;
        }

        /** @function nyplBreadcrumbs.stateAlreadyInBreadcrumbs
         * @param {obj}
         * @param {obj}
         * @returns {boolean}
         * @description Check whether the current `state` has already appeared in the current
         *  breadcrumbs object. This check is necessary when using abstract states that might 
         *  specify a proxy that is already there in the breadcrumbs.
         */
        function stateAlreadyInBreadcrumbs(state, breadcrumbs) {
          var i,
            alreadyUsed = false;
          for(i = 0; i < breadcrumbs.length; i++) {
            if (breadcrumbs[i].route === state.name) {
              alreadyUsed = true;
            }
          }
          return alreadyUsed;
        }

        /** @function nyplBreadcrumbs.initCrumbs
        * @returns {array}
        * @description Start with the current state and traverse up the path to build the
        * array of breadcrumbs that can be used in an ng-repeat in the template.
        */
        function initCrumbs() {
          var i,
            workingState,
            displayName,
            parentState,
            breadcrumbs = [],
            currentState = $state.$current,
            configStates = $crumb.getConfigChain();

          // Add initial configuration states if set
          if (configStates) {
            for (i = 0; i < configStates.length; i += 1) {
              breadcrumbs.push({
                displayName: configStates[i].name,
                route: configStates[i].customUrl
              });
            }
          }
          // Extract parent state if available
          parentState = getParentState(currentState);
          if (parentState) {
            // Parent data
            if (parentState.displayName && parentState.route) {
              breadcrumbs.push({
                displayName: parentState.displayName,
                route: parentState.route
              });
            }
            // Division data
            if (parentState.division) {
              breadcrumbs.push({
                displayName: parentState.division.name,
                route: parentState.division.route
              });
            }
          }

          // If the current-state is active and not empty
          // Then obtain the displayName and routes to be added
          while(currentState && currentState.name !== '') {

            workingState = getWorkingState(currentState);

            if (workingState) {
              displayName = getCrumbName(workingState);

              if (displayName !== false && !stateAlreadyInBreadcrumbs(workingState, breadcrumbs)) {
                breadcrumbs.push({
                  displayName: displayName,
                  route: workingState.name
                });
              }
            }

            // Assign parent as current state if available
            if (currentState.parent) {
              currentState = currentState.parent;
            }
          }
          scope.breadcrumbs = breadcrumbs;
        }

        // Initialize Crumbs
        if ($state.$current.name !== '') {
          initCrumbs();
        }
        scope.$on('$stateChangeSuccess', function () {
          initCrumbs();
        });
      }
    };
  }

  /**
   * @ngdoc overview
   * @module nyplBreadcrumbs
   * @name nyplBreadcrumbs
   * @description
   * AngularJS module for adding a custom NYPL breadcrumbs to all pages except
   * the homepage.
   */
  angular
    .module('nyplBreadcrumbs', [])
    .provider('$crumb', $Crumb)
    .directive('nyplBreadcrumbs', nyplBreadcrumbs);

})(window, window.angular);
/*jslint indent: 2, maxlen: 80, nomen: true */
/*globals $, window, console, jQuery, angular */

(function () {
  'use strict';

  /**
   * @ngdoc directive
   * @name nyplFeedback.directive:nyplFeedback
   * @restrict E
   * @requires $sce
   * @requires $rootScope
   * @scope
   * @description
   * Creates a small form component on the page that outputs an iframe to a
   * the link that's passed as an attribute. The height and width must also
   * be included when being created. The feedback button can display on the
   * right or left side of the page.
   * @example
   * <pre>
   *  <!-- Display the button on the right side and slide the feedback left -->
   *  <nypl-feedback data-url="https://www.surveymonkey.com/s/8T3CYMV"
   *    data-side="right" data-height="660" data-width="300"></nypl-feedback>
   *
   *  <!-- Display the button on the left side and slide the feedback right,
   *    different height and width -->
   *  <nypl-feedback data-url="https://www.surveymonkey.com/s/8T3CYMV"
   *    data-side="right" data-height="500" data-width="290"></nypl-feedback>
   * </pre>
   */
  nyplFeedback.$inject = ["$sce", "$rootScope"];
  function nyplFeedback($sce, $rootScope) {
    return {
      restrict: 'E',
      templateUrl: 'scripts/components/nypl_feedback/nypl_feedback.html',
      replace: true,
      scope: {
        height: '@',
        width: '@',
        url: '@',
        side: '@'
      },
      link: function (scope, element, attrs) {
        var arrow_direction = 'right';

        scope.trusted_url = $sce.trustAsResourceUrl(scope.url);
        scope.feedback = 'Feedback';

        if (scope.side === 'left') {
          element.addClass('left');
          arrow_direction = 'left';
        } else {
          element.addClass('right');
        }

        $rootScope.$watch('close_feedback', function (newVal, oldVal) {
          if (newVal) {
            $rootScope.close_feedback = false;
            element.removeClass('open');
            scope.feedback = 'Feedback';
            // element.find('a').removeClass('icon-arrow-' + arrow_direction);
          }
        });

        element.find('a').click(function () {
          element.toggleClass('open');
          // element.find('a').toggleClass('icon-arrow-' + arrow_direction);
          scope.feedback = element.hasClass('open') ? 'Close' : 'Feedback';

          scope.$apply();
        });
      }
    };
  }

  /**
   * @ngdoc overview
   * @module nyplFeedback
   * @name nyplFeedback
   * @description
   * AngularJS module for adding a feedback button and iframe to the site.
   * Currently used for adding Survey Monkey as the feedback form.
   */
  angular
    .module('nyplFeedback', [])
    .directive('nyplFeedback', nyplFeedback);

})();
/*jslint indent: 2, maxlen: 80, nomen: true */
/*globals $, window, console, jQuery, angular */

(function () {
  'use strict';

  /**
   * @ngdoc directive
   * @name nyplNavigation.directive:nyplNavigation
   * @restrict E
   * @requires ssoStatus
   * @requires $window
   * @requires $rootScope
   * @scope
   * @description
   * Displays the NYPL navigation menu.
   * @example
   * <pre>
   *  <nypl-navigation></nypl-navigation>
   * </pre>
   */
  function nyplNavigation(ssoStatus, $window, $rootScope) {
    return {
      restrict: 'E',
      scope: {
        activenav: '@',
        menuitem: '@'
      },
      replace: true,
      templateUrl: 'scripts/components/nypl_navigation/nypl_navigation.html',
      link: function (scope, element, attrs) {
        // Open/Close Main Navigation
        $('.dropDown').hover(
          function () {
            $(this).addClass('openDropDown');
          },
          function () {
            $(this).removeClass('openDropDown');
          }
        );

        $rootScope.$watch('current_url', function () {
          scope.logout_url = "https://nypl.bibliocommons.com/user/logout" +
            "?destination=" + $rootScope.current_url;
        })

        // Toggle Mobile Login Form
        $('.mobile-login').click(function (e) {
          e.preventDefault();
          if (ssoStatus.logged_in()) {
            $window.location.href = scope.logout_url;
          } else {
            $('.sso-login').toggleClass('visible');
          }
        });

        scope.menuLabel = 'Log In';
        if (ssoStatus.logged_in()) {
          scope.menuLabel = 'Log Out';
        }

      }
    };
  }
  nyplNavigation.$inject = ['ssoStatus', '$window', '$rootScope'];

  /**
   * @ngdoc directive
   * @name nyplNavigation.directive:nyplCollapsedButtons
   * @restrict E
   * @scope
   * @description
   * Displays the mobile collapsed buttons and add click event handlers.
   * @example
   * <pre>
   *  <nypl-collapsed-buttons></nypl-collapsed-buttons>
   * </pre>
   */
  function nyplCollapsedButtons() {
    return {
      restrict: 'E',
      scope: {},
      replace: true,
      templateUrl: 'scripts/components/nypl_navigation/nypl_collapsed_buttons.html',
      link: function (scope, element, attrs) {
        // Toggle Mobile Navigation
        var navBtn = element.find('.nav-open-button'),
          searchBtn = element.find('.search-open-button');

        navBtn.click(function () {
          $(this).toggleClass('open');
          searchBtn.removeClass('open');
          $('#search-block-form-input').removeClass('open-search');
          $('.search-options-resp').removeClass('open');
          $('#search-top').removeClass('open');
          $('#main-nav').toggleClass('open-navigation');
          $('.sso-login').removeClass('visible');
          return false;
        });

        // Toggle Mobile Search
        searchBtn.click(function () {
          $(this).toggleClass('open');
          navBtn.removeClass('open');
          $('#search-block-form-input').toggleClass('open-search');
          $('#search-top').toggleClass('open');
          $('#main-nav').removeClass('open-navigation');
          $('.sso-login').removeClass('visible');
          return false;
        });

      }
    };
  }

  /**
   * @ngdoc overview
   * @module nyplNavigation
   * @name nyplNavigation
   * @description
   * AngularJS module for adding the NYPL navigation menu as a directive.
   * This module also has a directive for adding mobile collapsed buttons.
   */
  angular
    .module('nyplNavigation', [])
    .directive('nyplNavigation', nyplNavigation)
    .directive('nyplCollapsedButtons', nyplCollapsedButtons);

})();


/*jslint indent: 2, maxlen: 80, nomen: true */
/*globals $, window, console, jQuery, angular */

(function () {
  'use strict';

  /**
   * @ngdoc directive
   * @name nyplSearch.directive:nyplSearch
   * @restrict E
   * @requires $analytics
   * @scope
   * @description
   * Displays the NYPL search from. Design and event handlers.
   * @example
   * <pre>
   *  <nypl-search></nypl-search>
   * </pre>
   */
  nyplSearch.$inject = ["$analytics"];
  function nyplSearch($analytics) {
    return {
      restrict: 'E',
      scope: {},
      replace: true,
      templateUrl: 'scripts/components/nypl_search/nypl_search.html',
      link: function (scope, element, attrs) {
        var o = {};

        // Set search box placeholder based on selected item
        function setPrompt(lmnt) {
          var item = lmnt.closest('li');
          if (item.hasClass('search-the-catalog')) {
            return o.term.attr('placeholder', o.prompt.catalog);
          }

          if (item.hasClass('search-the-website')) {
            return o.term.attr('placeholder', o.prompt.site);
          }

          return o.term.attr('placeholder', o.prompt.default_val);
        }

        // Get the search term from the input box. Returns '' if the
        // term is undefined
        function searchTerm() {
          return $.trim(o.term.val());
        }

        // Set error state in the search input box
        function setError(err) {
          if (err === undefined) {
            err = 'Please enter a search term';
          }
          return o.term.addClass('error').attr('placeholder', err);
        }

        // Clear error state in the search input box
        function clearError() {
          return o.term.removeClass('error').attr('placeholder', '');
        }

        // The element referred to by mobile_flag should be hidden by
        // a media query. Checking whether or not it is visible will tell
        // us if that mediq query is active
        function isMobile() {
          return !o.mobile_flag.is(':visible');
        }

        // Get text of the active search scope selection.
        // choice: optional element to use
        function getChoice(choice) {
          if (choice === undefined) {
            choice = o.choices.find('input[type=radio]:checked').parent();
          }
          return $.trim(choice.text()).toLowerCase();
        }

        // Execute the search
        function doSearch(scope) {
          var term = searchTerm(),
            target;

          if (scope === undefined) {
            scope = getChoice();
          }

          // Don't perform search if no term has been entered
          if (term.length === 0) {
            setError();
            $analytics.eventTrack('Empty Search',
                    { category: 'Header Search', label: '' });

            return false;
          }

          if (scope === 'nypl.org') {
            target = window.location.protocol + '//' + 'nypl.org'
              + '/search/apachesolr_search/' + term;

            $analytics.eventTrack('Submit Search',
                    { category: 'Header Search', label: term });
          } else {
            // Bibliocommons by default
            target = 'http://nypl.bibliocommons.com/search?t=smart&q='
              + term + '&commit=Search&searchOpt=catalogue';

            $analytics.eventTrack('Submit Catalog Search',
                    { category: 'Header Search', label: term });
          }
          window.location = target;
          return false;
        }

        function init() {
          angular.element('html').click(function () {
            element.find('.pseudo-select').removeClass('open');
            element.find('.error').removeClass('error');
          });

          var lmnt = element;

          o.term = lmnt.find('#search-block-form-input');
          o.search_button = lmnt.find('.search_button');
          o.choices = lmnt.find('.pseudo-select');
          o.mobile_flag = lmnt.find('.search-button');
          o.prompt = {
            default_val: o.term.attr("placeholder"),
            catalog: "Search the catalog",
            site: "Search NYPL.org"
          };

          // Don't let clicks get out of the search box
          lmnt.click(function (e) {
            e.stopPropagation();
          });

          // Override default submit, fire search button click event 
          // instead
          lmnt.find("#search-block-form").submit(function () {
            o.search_button.click();
            return false;
          });

          // Open search scope pane when you click into the
          // search input
          o.term.focus(function (e) {
            o.choices.addClass('open');
            $analytics.eventTrack('Focused',
                    { category: 'Header Search', label: 'Search Box' });
          });

          // If the error class has been set on the input box, remove it
          // when the user clicks into it
          o.term.focus(function () {
            clearError();
          });

          // Setup click action on submit button.
          lmnt.find('.search-button').click(function () {
            return doSearch();
          });

          // Setup click action on radio butons
          o.choices.find('li input').click(function () {
            setPrompt(angular.element(this));
            $analytics.eventTrack('Select',
                    { category: 'Header Search', label: getChoice() });
          });

          // Setup click action on list items (will be active when items are
          // as buttons on narrow screens
          o.choices.find('li').click(function () {
            if (isMobile()) {
              if (searchTerm().length === 0) {
                setError();
              } else {
                doSearch(getChoice(angular.element(this)));
              }
            }
          });
        }

        init();
      }
    };
  }

  /**
   * @ngdoc overview
   * @module nyplSearch
   * @name nyplSearch
   * @description
   * AngularJS module for managing the header search form and its input.
   */
  angular
    .module('nyplSearch', [
      'angulartics',
      'angulartics.google.analytics'
    ])
    .directive('nyplSearch', nyplSearch);

})();


/*jslint indent: 2, maxlen: 80, nomen: true */
/*globals $, window, console, jQuery, angular */

(function () {
  'use strict';

  /**
   * @ngdoc directive
   * @name nyplSSO.directive:nyplSso
   * @restrict E
   * @requires ssoStatus
   * @requires $window
   * @requires $rootScope
   * @scope
   * @description
   * Displays the NYPL SSO/donate button and login forms, to sign in and the
   * Bibliocommons signed in menu.
   * @example
   * <pre>
   *  <nypl-sso></nypl-sso>
   * </pre>
   */
  nyplSSO.$inject = ["ssoStatus", "$window", "$rootScope"];
  function nyplSSO(ssoStatus, $window, $rootScope) {
    return {
      restrict: 'E',
      scope: {},
      replace: true,
      templateUrl: 'scripts/components/nypl_sso/nypl_sso.html',
      link: function (scope, element, attrs) {
        var ssoLoginElement = $('.sso-login'),
          ssoUserButton = $('.login-button'),
          enews_email = $('.email-input-field'),
          enews_submit = $('#header-news_signup input[type=submit]'),
          enews_container = $('.header-newsletter-signup');

        enews_email.focus(function () {
          $('.newsletter_policy').slideDown();
        });

        enews_email.blur(function () {
          $('.newsletter_policy').slideUp();
        });

        enews_submit.click(function () {
          if (enews_email.val() === '') {
            enews_email.focus();
            return false;
          }
        });

        function makeForm(username, pin, checkbox, button) {
          var current_url = '';

          if (ssoStatus.remembered()) {
            username.val(ssoStatus.remember()); // Fill in username
            checkbox.attr("checked", true); // Mark the checkbox
          }
          
          // If the checkbox is unchecked, remove the cookie
          checkbox.click(function () {
            if (!$(this).is(':checked')) {
              ssoStatus.forget();
            }
          });

          $rootScope.$watch('current_url', function () {
            current_url = $rootScope.current_url;
          });

          // Submit the login form
          button.click(function (e) {
            var url = 'https://nypl.bibliocommons.com/user/login?destination=';
            e.preventDefault();

            if (checkbox.is(':checked')) {
              ssoStatus.remember(username.val());
            }

            url += current_url.replace('#', '%23') + '&';
            url += 'name=' + username.val();
            url += '&user_pin=' + pin.val();

            $window.location.href = url;
          });
        }

        function initForm(options) {
          var defaults = {
              username: '#username',
              pin: '#pin',
              remember_checkbox: '#remember_me',
              login_button: '#login-form-submit'
            },
            settings = $.extend({}, defaults, options);

          if (ssoStatus.logged_in()) {
            ssoLoginElement.addClass('logged-in');
          }

          makeForm(
            $(settings.username),
            $(settings.pin),
            $(settings.remember_checkbox),
            $(settings.login_button)
          );
        }

        function userButton(options) {
          $rootScope.$watch('current_url', function () {
            scope.logout_url = "https://nypl.bibliocommons.com/user/logout" +
              "?destination=" + $rootScope.current_url;
          })

          // Set the button label
          scope.header_button_label = "LOG IN";

          if (ssoStatus.logged_in()) {
            scope.header_button_label = ssoStatus.login();
            ssoUserButton.addClass('logged-in');
          }

          // Toggle Desktop Login Form
          ssoUserButton.click(function () {
            ssoLoginElement.toggleClass('visible');
          });
        }

        initForm();
        userButton();

      }
    };
  }

  /**
   * @ngdoc service
   * @name nyplSSO.service:ssoStatus
   * @description
   * AngularJS service used to check browser cookies to verify if a user
   * is logged in or not. Sets cookie when signing in and can remove cookies.
   */
  function ssoStatus() {
    var ssoStatus = {};

    /**
     * @ngdoc function
     * @name login
     * @methodOf nyplSSO.service:ssoStatus
     * @returns {string} User's usename from the bc_username cookie. If the
     * user is not logged in, undefined will be returned.
     */
    ssoStatus.login = function () {
      return $.cookie('bc_username');
    };

    /**
     * @ngdoc function
     * @name logged_in
     * @methodOf nyplSSO.service:ssoStatus
     * @returns {boolean} True if the user is logged in and false otherwise.
     */
    ssoStatus.logged_in = function () {
      return !!(this.login() && this.login() !== null);
    };

    /**
     * @ngdoc function
     * @name remember
     * @methodOf nyplSSO.service:ssoStatus
     * @param {string} [name] A setter and getter. Sets the user's username
     *  if the parameter was passed. If no parameter was passed, it will return
     *  the username from the remember_me cookie.
     * @returns {string} User's usename from the bc_username cookie. If the
     *  user is not logged in, undefined will be returned.
     */
    ssoStatus.remember = function (name) {
      if (name) {
        return $.cookie('remember_me', name, {path: '/'});
      }
      return $.cookie('remember_me');
    };

    /**
     * @ngdoc function
     * @name remembered
     * @methodOf nyplSSO.service:ssoStatus
     * @returns {boolean} Returns true if the user clicked on the 'Remember me'
     *  checkbox and the cookie is set, false otherwise.
     */
    ssoStatus.remembered = function () {
      var remember_me = this.remember();
      return !!(remember_me && remember_me !== null);
    };

    /**
     * @ngdoc function
     * @name forget
     * @methodOf nyplSSO.service:ssoStatus
     * @returns {boolean} Delete the 'remember_me' cookie if the 'Remember me'
     *  checkbox was unselected when submitting the form. Returns true if
     *  deleting was successful, false if deleting the cookie failed.
     */
    ssoStatus.forget = function () {
      return $.removeCookie('remember_me', {path: '/'});
    };

    return ssoStatus;
  }

  /**
   * @ngdoc overview
   * @module nyplSSO
   * @name nyplSSO
   * @description
   * AngularJS module for adding the SSO header button and functionality
   * including browser cookies for verifying against Bibliocommons.
   */
  angular
    .module('nyplSSO', [])
    .service('ssoStatus', ssoStatus)
    .directive('nyplSso', nyplSSO);

})();


/*jslint indent: 2, maxlen: 80 */
/*globals nypl_locations, angular */

(function () {
  'use strict';

  /**
   * @ngdoc service
   * @name coordinateService.service:nyplCoordinatesService
   * @requires $q
   * @requires $window
   * @description
   * AngularJS service to get a user's geolocation coordinates and calculate
   * the distance between two points.
   */
  nyplCoordinatesService.$inject = ["$q", "$window"];
  function nyplCoordinatesService($q, $window) {
    var geoCoords = null,
      coordinatesService = {};

    /**
     * @ngdoc function
     * @name geolocationAvailable
     * @methodOf coordinateService.service:nyplCoordinatesService
     * @returns {boolean} True if navigator and navigator.geolocation are
     *  available in the browser, false otherwise.
     */
    coordinatesService.geolocationAvailable = function () {
      return (!$window.navigator && !$window.navigator.geolocation) ?
          false :
          true;
    };

    /**
     * @ngdoc function
     * @name getBrowserCoordinates
     * @methodOf coordinateService.service:nyplCoordinatesService
     * @returns {object} Deferred promise. If it resolves, it will return an
     *  object with the user's current position as latitude and longitude
     *  properties. If it is rejected, it will return an error message based
     *  on what kind of error occurred.
     * @example
     * <pre>
     *  nyplCoordinatesService.getBrowserCoordinates()
     *    .then(function (position) {
     *      var userCoords = _.pick(position, 'latitude', 'longitude');
     *    })
     *    .catch(function (error) {
     *      throw error;
     *    });
     * </pre>
     */
    coordinatesService.getBrowserCoordinates = function () {
      // Object containing success/failure conditions
      var defer = $q.defer();

      // Verify the browser supports Geolocation
      if (!this.geolocationAvailable()) {
        defer.reject(new Error("Your browser does not support Geolocation."));
      } else {
        // Use stored coords, FF bug fix
        // if (geoCoords) {
        //   defer.resolve(geoCoords);
        // } else {
        $window.navigator.geolocation.getCurrentPosition(
          function (position) {
            // Extract coordinates for geoPosition obj
            geoCoords = position.coords;
            defer.resolve(geoCoords);

            // Testing a user's location that is more than 
            // 25miles of any NYPL location
            // var coords = {
            //     'latitude': 42.3581,
            //     'longitude': -71.0636
            // }
            // defer.resolve(coords);
          },
          function (error) {
            switch (error.code) {
            case error.PERMISSION_DENIED:
              defer.reject(new Error("Permission denied."));
              break;

            case error.POSITION_UNAVAILABLE:
              defer.reject(new Error("The position is currently unavailable."));
              break;

            case error.TIMEOUT:
              defer.reject(new Error("The request timed out."));
              break;

            default:
              defer.reject(new Error("Unknown error."));
              break;
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 600000
          }
        );
        // }
      }

      return defer.promise; // Enables 'then' callback
    };

    /**
     * @ngdoc function
     * @name getDistance
     * @methodOf coordinateService.service:nyplCoordinatesService
     * @param {number} lat1 Latitude of first location.
     * @param {number} lon1 Longitude of first location.
     * @param {number} lat2 Latitude of second location.
     * @param {number} lon2 Longitude of second location.
     * @returns {number} Distance in miles between two different locations.
     * @example
     * <pre>
     *  var distance =
     *    nyplCoordinatesService.getDistance(40.1, -73.1, 41.1, -73.2);
     * </pre>
     */
    coordinatesService.getDistance = function (lat1, lon1, lat2, lon2) {
      if (!lat1 || !lon2 || !lat2 || !lon2) {
        return undefined;
      }

      var radlat1 = Math.PI * lat1 / 180,
        radlat2 = Math.PI * lat2 / 180,
        theta = lon1 - lon2,
        radtheta = Math.PI * theta / 180,
        distance;

      distance = Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      distance = Math.acos(distance);
      distance = distance * 180 / Math.PI;
      distance = distance * 60 * 1.1515;
      return Math.ceil(distance * 100) / 100;
    };

    return coordinatesService;
  }

  /**
   * @ngdoc overview
   * @module coordinateService
   * @name coordinateService
   * @description
   * AngularJS module that provides a service to use a browser's geolocation
   * coordinates and a function to calculate distance between two points.
   */
  angular
    .module('coordinateService', [])
    .factory('nyplCoordinatesService', nyplCoordinatesService);

})();


/*jslint indent: 4, maxlen: 80 */
/*globals angular */

(function () {
    'use strict';

    /**
     * @ngdoc service
     * @name locationService.service:nyplLocationsService
     * @requires $http
     * @requires $q
     * @description
     * AngularJS service to call different API endpoints.
     */

    nyplLocationsService.$inject = ["$http", "$q"];
    function nyplLocationsService($http, $q) {
        var api, config,
            jsonp_cb = '?callback=JSON_CALLBACK',
            apiError = 'Could not reach API',
            locationsApi = {};

        /**
         * @ngdoc function
         * @name getConfig
         * @methodOf locationService.service:nyplLocationsService
         * @returns {object} Deferred promise.
         * @description
         * Used to get Sinatra generated config variables.
         */
        locationsApi.getConfig = function () {
            var defer = $q.defer();

            if (config) {
               defer.resolve(config);
            } else {
                config = window.locations_cfg.config;

                if (config) {
                    api = config.api_root + '/' + config.api_version;
                    defer.resolve(config);
                } else {
                    defer.reject(apiError + ': config');
                }
            }

            return defer.promise;
        }

        /**
         * @ngdoc function
         * @name allLocations
         * @methodOf locationService.service:nyplLocationsService
         * @returns {object} Deferred promise. If it resolves, JSON response
         *  from the API of all NYPL locations. If it is rejected, an
         *  error message is returned saying that it "Could not reach API".
         * @description Get all locations
         * @example
         * <pre>
         *  nyplLocationsService.allLocations()
         *    .then(function (data) {
         *      var locations = data.locations;
         *    });
         *    .catch(function (error) {
         *      // error = "Could not reach API"
         *    });
         * </pre>
         */
        locationsApi.allLocations = function () {
            var defer = $q.defer();

            $http.jsonp(
                    api + '/locations' + jsonp_cb,
                    {cache: true}
                )
                .success(function (data) {
                    defer.resolve(data);
                })
                .error(function (data, status) {
                    defer.reject(apiError + ': locations');
                });
            return defer.promise;
        };

        /**
         * @ngdoc function
         * @name singleLocation
         * @methodOf locationService.service:nyplLocationsService
         * @param {string} location The slug of the location to look up.
         * @returns {object} Deferred promise. If it resolves, JSON response
         *  from the API of a specific NYPL locations. If it is rejected,
         *  an error message is returned saying that it "Could not reach API".
         * @description Get single location.
         * @example
         * <pre>
         *  nyplLocationsService.singleLocation('schwarzman')
         *    .then(function (data) {
         *      var location = data.location;
         *    });
         *    .catch(function (error) {
         *      // error = "Could not reach API"
         *    });
         * </pre>
         */
        locationsApi.singleLocation = function (location) {
            var defer = $q.defer();

            $http.jsonp(
                    api + '/locations/' + location + jsonp_cb,
                    {cache: true}
                )
                .success(function (data) {
                    defer.resolve(data);
                })
                .error(function (data, status) {
                    defer.reject(apiError + ': location');
                });
            return defer.promise;
        };

        locationsApi.allDivisions = function () {
            var defer = $q.defer();

            $http.jsonp(
                api + '/divisions?callback=JSON_CALLBACK', {cache: true}
            )
            .success(function (data) {
                defer.resolve(data);
            })
            .error(function (data, status) {
                defer.reject(apiError + ': division');
            });
            return defer.promise;
        };

        /**
         * @ngdoc function
         * @name singleDivision
         * @methodOf locationService.service:nyplLocationsService
         * @param {string} division The slug of the division to look up.
         * @returns {object} Deferred promise. If it resolves, JSON response
         *  from the API of an NYPL Division. If it is rejected, an error
         *  message is returned saying that it "Could not reach API".
         * @description Get single division.
         * @example
         * <pre>
         *  nyplLocationsService.singleLocation('map-division')
         *    .then(function (data) {
         *      var division = data.division;
         *    });
         *    .catch(function (error) {
         *      // error = "Could not reach API"
         *    });
         * </pre>
         */
        locationsApi.singleDivision = function (division) {
            var defer = $q.defer();

            $http.jsonp(
                    api + '/divisions/' + division + jsonp_cb,
                    {cache: true}
                )
                .success(function (data) {
                    defer.resolve(data);
                })
                .error(function (data, status) {
                    defer.reject(apiError + ': division');
                });
            return defer.promise;
        };

        /**
         * @ngdoc function
         * @name amenities
         * @methodOf locationService.service:nyplLocationsService
         * @param {string} [amenity] The id of the amenity to look up.
         * @returns {object} Deferred promise. If it resolves, JSON response
         *  from the API. If no param was passed, it will return all the
         *  amenities at NYPL. If the param was passed, it will return a list
         *  of all the NYPL locations where the amenity passed is available.
         *  If it is rejected, an error message is returned saying that it
         *  "Could not reach API".
         * @description Get all amenities.
         * @example
         * <pre>
         *  nyplLocationsService.amenities()
         *    .then(function (data) {
         *      var amenities = data;
         *    });
         *    .catch(function (error) {
         *      // error = "Could not reach API"
         *    });
         *
         *  nyplLocationsService.amenities('7950')
         *    .then(function (data) {
         *      var amenity = data;
         *    });
         *    .catch(function (error) {
         *      // error = "Could not reach API"
         *    });
         * </pre>
         */
        locationsApi.amenities = function (amenity) {
            var defer = $q.defer(),
                url = !amenity ? '/amenities' : '/amenities/' + amenity;

            $http.jsonp(api + url + jsonp_cb, {cache: true})
                .success(function (data) {
                    defer.resolve(data);
                })
                .error(function (data, status) {
                    defer.reject(apiError + ': amenities');
                });
            return defer.promise;
        };

        /**
         * @ngdoc function
         * @name amenitiesAtLibrary
         * @methodOf locationService.service:nyplLocationsService
         * @param {string} location The slug of the location to look up
         *  all amenities available at that location.
         * @returns {object} Deferred promise. If it resolves, JSON response
         *  from the API of all amenities available at the location. If it is
         *  rejected, an error message is returned saying that it
         *  "Could not reach API".
         * @description Get amenities at a library.
         * @example
         * <pre>
         *  nyplLocationsService.amenitiesAtLibrary('115th-street')
         *    .then(function (data) {
         *      var location = data.location;
         *    });
         *    .catch(function (error) {
         *      // error = "Could not reach API"
         *    });
         * </pre>
         */
        locationsApi.amenitiesAtLibrary = function (location) {
            var defer = $q.defer();

            $http.jsonp(
                    api + '/locations/' + location + '/amenities' + jsonp_cb,
                    {cache: true}
                )
                .success(function (data) {
                    defer.resolve(data);
                })
                .error(function (data, status) {
                    defer.reject(apiError + ': library-amenity');
                });
            return defer.promise;
        };

        /**
         * @ngdoc function
         * @name alerts
         * @methodOf locationService.service:nyplLocationsService
         * @returns {object} Deferred promise. If it resolves, JSON response
         *  from the API of alerts that display site-wide.
         * @description Get all alerts.
         * @example
         * <pre>
         *  nyplLocationsService.alerts()
         *    .then(function (data) {
         *      var amenities = data.alerts;
         *    });
         *    .catch(function (error) {
         *      // error = "Could not reach API"
         *    });
         * </pre>
         */
        locationsApi.alerts = function () {
            var defer = $q.defer();

            $http.jsonp(
                    api + '/alerts' + jsonp_cb,
                    {cache: true}
                )
                .success(function (data) {
                    defer.resolve(data);
                })
                .error(function (data, status) {
                    defer.reject(apiError + ': site-wide alerts');
                });
            return defer.promise;
        };

        locationsApi.terms = function () {
            var defer = $q.defer();

            $http.jsonp(
                    api + '/terms' + '?callback=JSON_CALLBACK',
                    {cache: true}
                )
                .success(function (data) {
                    defer.resolve(data);
                })
                .error(function (data, status) {
                    defer.reject(apiError + ': terms');
                });
            return defer.promise;
        };

        return locationsApi;
    }

    /**
     * @ngdoc overview
     * @module locationService
     * @name locationService
     * @description
     * AngularJS module that provides a service to call the API endpoints.
     */
    angular
        .module('locationService', [])
        .factory('nyplLocationsService', nyplLocationsService);

})();

/*jslint indent: 2, maxlen: 80, nomen: true */
/*globals nypl_locations, _, angular, jQuery,
console, $location, $ */

(function () {

  CollectionsCtrl.$inject = ["$scope", "$rootScope", "$timeout", "$filter", "$location", "$nyplAlerts", "config", "divisions", "nyplAlertsService", "nyplLocationsService", "nyplUtility", "params"];
  function CollectionsCtrl(
    $scope,
    $rootScope,
    $timeout,
    $filter,
    $location,
    $nyplAlerts,
    config,
    divisions,
    nyplAlertsService,
    nyplLocationsService,
    nyplUtility,
    params
  ) {
    var sibl,
      research_order = config.research_order || ['SASB', 'LPA', 'SC', 'SIBL'],
      getHoursOrAlert = function (obj) {
        var alerts,
          alertMsg,
          hoursMessageOpts;

        _.each(obj, function (elem) {
          if (elem._embedded.alerts) {
            alerts = elem._embedded.alerts;
            alertMsg = nyplAlertsService.getCurrentActiveMessage(alerts);
          }

          hoursMessageOpts = {
            message: alertMsg,
            open: elem.open,
            hours: elem.hours,
            hoursFn: getlocationHours,
            closedFn: branchClosedMessage
          };
          // CSS class for a closing
          elem.closingMessageClass = closingMessageClass(alerts);
          // Assign proper title for hours today or closing
          elem.todaysHoursDisplay = alertMsg ? 'Today:' : 'Today\'s Hours:';
          // Hours or closing message that will display
          elem.hoursOrClosingMessage =
            nyplAlertsService
              .getHoursOrMessage(hoursMessageOpts);
        });
      },
      loadTerms = function () {
        return nyplLocationsService
          .terms()
          .then(function (data) {
            var dataTerms = [];

            _.each(data.terms, function (term) {
              var newTerms = term.terms,
                subjectsSubterms = [],
                index = term.name === 'Subjects' ? 0 : 1;
              dataTerms[index] = {
                id: term.id,
                name: term.name,
                terms: newTerms
              };
            });
            dataTerms.push({
              name: 'Locations',
              locations: $scope.divisionLocations
            });
            $scope.terms = dataTerms;

            filterByParams();
          });
      },
      loadSIBL = function () {
        return nyplLocationsService
          .singleLocation('sibl')
          .then(function (data) {
            // Assign Today's hours or Alert Closing Msg
            getHoursOrAlert([data.location]);
            sibl = data.location;
            sibl._embedded.location = {
              id: 'SIBL'
            };

            $scope.filteredDivisions.push(sibl);
            $scope.divisions.push(sibl);
            $scope.divisionLocations.push(sibl);

            _.each($scope.divisionLocations, function (location) {
              location.short_name = config.research_shortnames[location.id];
            });
          });
      },
      filterByParams = function () {
        setSubjectFilter();
        setMediaFilter();
        setLocationFilter();

        filterDivisions();
      },
      setSubjectFilter = function () {
        var searchSubject, searchSubjectSubterm;

        if (params.subjects) {
          _.each($scope.terms[0].terms, function (topLevelTerm) {
            var findSubterm;

            // If the Subject term or subterm is not found, then look for it.
            if (!searchSubject) {
              // If the term matches a top level Subject term,
              // return that match.
              if (topLevelTerm.name === $filter('unslugify')(params.subjects)) {
                searchSubject = topLevelTerm;
              } else {
                // If it's not a top level term, then we must look at the
                // subterms array.
                findSubterm = _.findWhere(topLevelTerm.terms,
                  {name: $filter('unslugify')(params.subjects)});

                // If it's found, we want to return both the parent term
                // and the subterm.
                if (findSubterm) {
                  searchSubject = topLevelTerm;
                  searchSubjectSubterm = findSubterm;
                }
              }
            }

          });

          // If only the top level Subject term was found,
          // we want to add it as a filter and include the subterms.
          if (searchSubject && !searchSubjectSubterm) {
            $scope.filter_results[0].name = searchSubject.name;
            $scope.filter_results[0].active = true;
            $scope.filter_results[0].id = searchSubject.id;
            $scope.filter_results[0].subterms = searchSubject.terms;
          } else if (searchSubjectSubterm) {
            // If the matching filter is a subterm, we want to add the
            // parent term name to the filtered result.
            // E.g. Fine Arts - Architecture, where Fine Arts is the
            // parent term. 
            $scope.filter_results[0].name =
              searchSubject.name + ' - ' +searchSubjectSubterm.name;
            $scope.filter_results[0].active = true;
            $scope.filter_results[0].id = searchSubjectSubterm.id;
          } else {
            // Nothing found from query parameter so remove it
            $location.search('subjects', null);
          }
        }

        $scope.selectedSubjectsSubterm =
          _.indexOf($scope.terms[0].terms, searchSubject);
      },
      setMediaFilter = function () {
        var searchMedia;

        if (params.media) {
          searchMedia = _.findWhere($scope.terms[1].terms,
            {name: $filter('unslugify')(params.media)});

          if (searchMedia) {
            $scope.filter_results[1].name = searchMedia.name;
            $scope.filter_results[1].active = true;
            $scope.filter_results[1].id = searchMedia.id;
          } else {
            $location.search('media', null);
          }
        }

        $scope.selectedMediaSubterm =
          _.indexOf($scope.terms[1].terms, searchMedia);
      },
      setLocationFilter = function () {
        var searchLocations;

        if (params.locations) {
          searchLocations = _.findWhere($scope.terms[2].locations,
            {slug: params.locations});

          if (searchLocations) {
            $scope.filter_results[2].name =
              (searchLocations.slug).charAt(0).toUpperCase() +
              (searchLocations.slug).slice(1);
            $scope.filter_results[2].active = true;
            $scope.filter_results[2].id = searchLocations.id;
          } else {
            $location.search('locations', null);
          }
        }

        $scope.selectedLocationsSubterm =
          _.indexOf($scope.terms[2].locations, searchLocations);
      },
      removeQueryParams = function () {
        // Remove the queries from the url once the page loads
        $location.search('subjects', null);
        $location.search('media', null);
        $location.search('locations', null);
      };

    $rootScope.title = "Research Divisions";
    $scope.filter_results = [
      {label: 'Subjects', name: '', id: undefined, active: false, subterms: undefined},
      {label: 'Media', name: '', id: undefined, active: false},
      {label: 'Locations', name: '', id: undefined, active: false}
    ];
    
    // Assign short name to every location in every division
    _.each(divisions, function (division) {
      var location = division._embedded.location;
      location.short_name =
        config.research_shortnames[location.id];
    });

    $scope.divisions = divisions;
    $scope.terms = [];

    $scope.filteredDivisions = _.chain(divisions)
      .sortBy(function (elem) {
        return elem.name;
      })
      .flatten()
      .value();

    $scope.divisionLocations = _.chain(divisions)
      .pluck('_embedded')
      .flatten()
      .pluck('location')
      .indexBy('id')
      .sortBy(function (elem) {
        return nyplUtility.researchLibraryOrder(
          research_order,
          elem.id
        );
      })
      .flatten()
      .value();

    loadSIBL().then(loadTerms);
    configureGlobalAlert();
    // Assign Today's hours or Alert Closing Msg
    getHoursOrAlert(divisions);

    $scope.selectCategory = function (index, term) {
      if ($scope.categorySelected === index) {
        $scope.categorySelected = undefined;
        $scope.activeCategory = undefined;
        return;
      }

      $scope.activeCategory = term.name;

      // For the data-ng-class for the active buttons.
      // Reset the subterm button.
      $scope.categorySelected = index;
    };

    function configureGlobalAlert() {
      $scope.globalClosingMessage;
      if ($nyplAlerts.alerts && $nyplAlerts.alerts.length) {
        $scope.globalClosingMessage =
          nyplAlertsService.getCurrentActiveMessage($nyplAlerts.alerts);
      }
    }

    function closingMessageClass(location_alerts) {
      var alerts = nyplAlertsService.activeClosings(location_alerts);
      return (alerts) ? true : false;
    }

    function getlocationHours(hours) {
      return $filter('timeFormat')(nyplUtility.hoursToday(hours));
    }

    function branchClosedMessage() {
      return "<b>Division is temporarily closed.</b>";
    }

    function getSubjectFilters() {
      if ($scope.filter_results[0].active) {
        if ($scope.filter_results[0].subterms) {
          return $scope.filter_results[0].subterms;
        }
        return [{id: $scope.filter_results[0].id}];
      }
      return false;
    }

    // Only get Media and Location filters
    function getMediaLocationsFilters() {
      return _.chain($scope.filter_results)
        .filter(function (filter) {
          return (filter.active && filter.label !== 'Subjects');
        })
        .map(function (filter) {
          return filter.id;
        })
        .value();
    }

    function filterBySubject(subjectFitlers) {
      return _.chain($scope.divisions)
        .filter(function (division) {
          var found = false;
          _.each(subjectFitlers, function (subjectTerm) {
            // Search through each parent term
            _.each(division.terms, function (parentTerm) {
              // If already found, no need to keep searching;
              if (!found) {
                // Find the term where the ID matches what was selected
                found = _.find(parentTerm.terms, function (term) {
                  return term.id === subjectTerm.id;
                });
              }
            });
          });

          // Return the boolean value of found. True if there's an object,
          // false if no object was found.
          return !!found;
        })
        .sortBy(function (elem) {
          return elem.name;
        })
        .flatten()
        .value();
    }

    function filterByMediaAndLocation(idsToCheck, savedFilteredArr) {
      return _.chain(savedFilteredArr)
        .filter(function (division) {
          var foundArr = [];
          _.each(idsToCheck, function (termID) {

            var found = false;
            // Search through each parent term
            _.each(division.terms, function (parentTerm) {
              // If already found, no need to keep searching;
              if (!found) {
                // Find the term where the ID matches what was selected
                found = _.find(parentTerm.terms, function (term) {
                  return term.id === termID;
                });
                if (found) {
                  foundArr.push(true);
                }
              }
            });

            if (!found) {
              if (division._embedded.location.id === termID) {
                foundArr.push(true);
              }
            }
          });

          // Return the boolean value of found. True if there's an object,
          // false if no object was found.
          return (foundArr.length === idsToCheck.length);
        })
        .sortBy(function (elem) {
          return elem.name;
        })
        .flatten()
        .value();
    }

    function filterDivisions() {
      var idsToCheck = getMediaLocationsFilters(),
        savedFilteredArr = [],
        subjectFitlers = getSubjectFilters();

      // Display the "Current Filters:" if there are any ids to filter by
      if (idsToCheck.length || subjectFitlers.length) {
        $scope.showActiveFilters = true;
      } else {
        $scope.showActiveFilters = false;
      }

      // If there are subjects to filter through, do those first
      if (subjectFitlers.length) {
        savedFilteredArr = filterBySubject(subjectFitlers);
      } else {
        // If no subjects to filter through, use all the divisions
        savedFilteredArr = $scope.divisions;
      }

      // No Media or Locations to filter through
      if (idsToCheck.length === 0) {
        $scope.filteredDivisions = savedFilteredArr;
      } else {
        // Filter through Media or Location ids
        $scope.filteredDivisions =
          filterByMediaAndLocation(idsToCheck, savedFilteredArr);
      }
    }

    function fixTermName(label, term) {
      var name, parentSubject = '';

      if (label === "Subjects") {
        _.each($scope.terms[0].terms, function (childterm) {
          if (_.findWhere(childterm.terms, {name: term.name})) {
            parentSubject = childterm.name + ' - ';
          }
        });
        name = parentSubject + term.name;
      } else if (label === "Locations") {
          name = term.short_name;
      } else {
        name = term.name;
      }

      return name;
    }

    function activeSubterm(term) {
      var label = $scope.activeCategory,
        name = fixTermName(label, term),
        currentSelected = _.findWhere(
          $scope.filter_results,
          {label: label, name: name}
        );

      // Selection doesn't exist so add it
      if (!currentSelected) {
        _.each($scope.filter_results, function (subterm) {
          if (subterm.label === label) {
            subterm.name = name;
            subterm.active = true;
            subterm.id = term.id;
            if (subterm.label === 'Subjects') {
              subterm.name = name;
              subterm.subterms = term.terms;
            }
          }
        });
        return;
      }

      // Exists so remove it
      $location.search(label.toLowerCase(), null);
      $scope['selected' + label + 'Subterm'] = undefined;
      _.each($scope.filter_results, function (subterm) {
        if (subterm.label === label) {
          subterm.name = '';
          subterm.active = false;
          subterm.id = undefined;
          if (subterm.label === 'Subjects') {
            subterm.subterms = undefined;
          }
        }
      });
      return;
    }

    function showSubtermsForCategory(index) {
      $scope['selected' + $scope.activeCategory + 'Subterm'] = index;
    }

    $scope.filterDivisionsBy = function (index, selectedTerm) {
      // Comment out if you don't want the queries to appear in the url
      if ($scope.activeCategory === 'Locations') {
        $location.search(
          $scope.activeCategory.toLowerCase(),
          selectedTerm.slug
        );
      } else {
        $location.search(
          $scope.activeCategory.toLowerCase(),
          $filter('slugify')(selectedTerm.name)
        );
      }

      // Display the correct list for the selected category
      showSubtermsForCategory(index);

      // Highlight the current selected subterm
      activeSubterm(selectedTerm);

      // Hides wrapper on mobile only after selection of filter
      if (nyplUtility.isMobile()) {
        $timeout( function() {
          $scope.categorySelected = undefined;
          $scope.activeCategory = undefined;
        }, 700);
      }

      return filterDivisions();
    };

    $scope.removeFilter = function (filter) {
      // Remove query param from url
      $location.search(filter.label.toLowerCase(), null);

      $scope['selected' + filter.label + 'Subterm'] = undefined;
      filter.active = false;
      filter.name = '';
      filter.id = undefined;

      // Now go through the process of filtering again:
      filterDivisions();
    };

  }

  angular
    .module('nypl_research_collections')
    .controller('CollectionsCtrl', CollectionsCtrl);

})();

/*jslint unparam: true, indent: 2, maxlen: 80 */
/*globals nypl_locations, $window, angular */

(function () {
  'use strict';

  /**
   * @ngdoc directive
   * @name nypl_locations.directive:loadingWidget
   * @restrict A
   * @requires requestNotificationChannel
   * @description
   * Credit: Jim Lasvin -- https://github.com/lavinjj/angularjs-spinner
   * declare the directive that will show and hide the loading widget
   */
  nyplFooter.$inject = ["$analytics"];
  loadingWidget.$inject = ["requestNotificationChannel"];
  function loadingWidget(requestNotificationChannel) {
    return {
      restrict: "A",
      link: function (scope, element) {
        var startRequestHandler = function (event) {
          // got the request start notification, show the element
          element.addClass('show');
        },
        endRequestHandler = function (event) {
          // got the request start notification, show the element
          element.removeClass('show');
        };

        // hide the element initially
        if (element.hasClass('show')) {
          element.removeClass('show');
        }

        // register for the request start notification
        requestNotificationChannel.onRequestStarted(scope, startRequestHandler);
        // register for the request end notification
        requestNotificationChannel.onRequestEnded(scope, endRequestHandler);
      }
    };
  }

  /**
   * @ngdoc directive
   * @name nypl_locations.directive:nyplTranslate
   * @restrict E
   * @description
   * Directive to display a list of languages to translate the site into.
   * Commented out until use.
   * @example
   * <pre>
   *  <nypl-translate></nypl-translate>
   * </pre>
   */
  // function nyplTranslate() {
  //   return {
  //     restrict: 'E',
  //     templateUrl: 'scripts/directives/templates/translatebuttons.html',
  //     replace: true,
  //     controller: function ($scope, $translate) {
  //       $scope.translate = function (language) {
  //         $translate.use(language);
  //       };
  //     }
  //   };
  // }


  /**
   * @ngdoc directive
   * @name nypl_locations.directive:scrolltop
   * @requires $window
   * @description
   * ...
   */
  function scrolltop($window) {
    return function (scope) {
      scope.$on('$stateChangeStart', function () {
        $window.scrollTo(0, 0);
      });
    };
  }

  /**
   * @ngdoc directive
   * @name nypl_locations.directive:collapse
   * @restrict A
   * @description
   * Show/Hide collapsible animated directive. Duration & class-name
   * are optional.
   * @example
   * <pre>
   *  <div collapse="name of var toggled" duration="time in ms"
   *          class-name="open"></div>
   * </pre>
   */
  function collapse() {
    function link($scope, element, attributes) {
      var exp = attributes.collapse,
        class_name = (attributes.className || "open"),
        duration = (attributes.duration || "fast");

      if (!$scope.$eval(exp)) {
        element.hide();
      }

      // Watch the expression in $scope context to
      // see when it changes and adjust the visibility
      $scope.$watch(
        exp,
        function (newVal, oldVal) {
          // If values are equal -- just return
          if (newVal === oldVal) {
            return;
          }
          // Show element.
          if (newVal) {
            element.stop(true, true)
              .slideDown(duration)
              .addClass(class_name);
          } else {
            element.stop(true, true)
              .slideUp(duration)
              .removeClass(class_name);
          }
        }
      );
    }

    return ({
      link: link,
      restrict: "A" // Attribute only
    });
  }

  /**
   * @ngdoc directive
   * @name nypl_locations.directive:nyplFooter
   * @restrict E
   * @requires $analytics
   * @scope
   * @description
   * NYPL Footer. Changed to directive to add analytics events handler.
   * @example
   * <pre>
   *  <nypl-footer></nypl-footer>
   * </pre>
   */
  function nyplFooter($analytics) {
    return {
      restrict: 'E',
      templateUrl: 'scripts/directives/templates/footer.html',
      replace: true,
      scope: {},
      link: function (scope, elem, attrs) {
        var footerLinks = elem.find('.footerlinks a'),
          linkHref;

        footerLinks.click(function () {
          linkHref = angular.element(this).attr('href');

          $analytics.eventTrack('Click',
                    { category: 'footer', label: linkHref });
        });

        // Dynamic Year
        scope.year = new Date().getFullYear();
      }
    };
  }

  /**
   * @ngdoc directive
   * @name nypl_locations.directive:collapsibleFilters
   * @restrict AEC
   * @scope
   * @description
   * Collapsible Filters: Hides/Displays filterable data
   * @example
   * <pre>
   *  <collapsible-filters data='object'></collapsible-filters>
   * </pre>
   */
  function collapsibleFilters() {
    return {
      restrict: 'AE',
      templateUrl: 'scripts/directives/templates/collapsible-filters.html',
      replace: false,
      scope: {
        items: '=data',
        parentTermName: '=',
        filterItem: '&',
        filteredResults: '='
      },
      link: function ($scope, elem, attrs) {
        var filterControl = elem.find('.collapsible-control'),
            filterBox = elem.find('.collapsible-filters');

        $scope.toggleFilters = function() {
          if (filterControl.hasClass('open')) {
            filterControl.removeClass('open');
            filterBox.removeClass('open');
          } else {
            $('.collapsible-control').removeClass('open');
            $('.collapsible-filters').removeClass('open');
            filterControl.addClass('open');
            filterBox.addClass('open');
          }
        }

        // Toggles active filter match
        $scope.checkActiveFilter = function(results, termID) {
          return $scope.activeFilter = _.findWhere(results, {id: termID});
        }
      }
    };
  }

  /**
   * @ngdoc directive
   * @name nypl_locations.directive:closeSubMenu
   * @restrict A
   * @description
   *  Closes modal menus for children if they are open. Related to
   *  the collapsibleFilters directive.
   * @example
   *  <a href="#" closeSubMenu>...</a>
   */
  function closeSubMenu() {
    return {
      restrict: 'A',
      scope: false,
      link: function ($scope, elem, attrs) {
        elem.click(function () {
          $('.collapsible-control').removeClass('open');
          $('.collapsible-filters').removeClass('open');
        });
      }
    };
  }

  angular
    .module('nypl_research_collections')
    .directive('collapse', collapse)
    .directive('closeSubMenu', closeSubMenu)
    .directive('collapsibleFilters', collapsibleFilters)
    .directive('nyplFooter', nyplFooter)
    .directive('loadingWidget', loadingWidget);
})();

/*jslint indent: 4, maxlen: 80, nomen: true */
/*globals nypl_locations, console, _, angular */

(function () {
    'use strict';

    /**
     * @ngdoc filter
     * @name nypl_locations.filter:timeFormat
     * @param {object} timeObj Object with hours for today and tomorrow.
     * @returns {string} Closed or open times for a branch with possible
     *  alert returned.
     * @description
     *  timeFormat() filter formats military time to standard time. 
     *  In addition, if an alert is present, it displays 
     *  the approapriate message for a relevant alert.
     *  1) all day closing 2) early/late opening/closing
     */
    timeFormat.$inject = ["$sce"];
    function timeFormat($sce) {
        function getMilitaryHours(time) {
            var components = time.split(':'),
                hours = parseInt(components[0], 10);
            return hours;
        }

        function closingHoursDisplay(hours, alerts) {
            var sDate, eDate, allDay, regHours,
                openHour, closedHour, displayString;

            if (!alerts.length) {
                sDate = moment(alerts.applies.start);
                eDate = moment(alerts.applies.end);
                openHour = getMilitaryHours(hours.open);
                closedHour = getMilitaryHours(hours.close);
                allDay = (eDate.isAfter(sDate, 'day')) ? true : false;

                // First, check if this is an all day closing
                // Then, verify that it is an early closing or late opening
                // Finally, if the user enters something outside of those bounds
                // default to a change in hours.
                if (allDay || alert.infinite === true) {
                    displayString = 'Closed *';
                } else if (sDate.hours() <= openHour && eDate.hours() >= closedHour) {
                    displayString = 'Closed *'
                } else if (openHour < sDate.hours() && closedHour <= eDate.hours()) {
                    displayString = 'Closing early *';
                } else if (closedHour > eDate.hours() && openHour >= sDate.hours()) {
                    displayString = 'Opening late *';
                } else {
                    displayString = 'Change in hours *';
                }
            }
            return $sce.trustAsHtml(displayString);
        }

        return function output(timeObj) {
            // The time object may have just today's hours
            // or be an object with today's and tomorrow's hours
            var alerts,
                time = timeObj !== undefined && timeObj.today !== undefined ?
                    timeObj.today :
                    timeObj;

            // Checking if thruthy needed for async calls
            if (time) {
                alerts = time.alert || null;

                if (time.open === null) {
                    return 'Closed';
                } else if (alerts) {
                    return closingHoursDisplay(time, alerts);
                }
                return apStyle(time.open, 'time') + '–' + apStyle(time.close, 'time');
            }

            console.log('timeFormat() filter error: Argument is' +
                ' not defined or empty, verify API response for time');
            return '';
        };
    }

    /**
     * @ngdoc filter
     * @name nypl_locations.filter:dateToISO
     * @param {string} input ...
     * @returns {string} ...
     * @description
     * Coverts MYSQL Datetime stamp to ISO format
     */
    function dateToISO() {
        return function (input) {
            return new Date(input).toISOString();
        };
    }

    /**
     * @ngdoc filter
     * @name nypl_locations.filter:capitalize
     * @params {string} input
     * @returns {string} ...
     * @description
     * Capitalize all the words in a phrase.
     */
    function capitalize() {
        return function (input) {
            if (typeof input === 'string') {
                return input.replace(/(^|\s)([a-z])/g, function (str) {
                    return str.toUpperCase();
                });
            }
            return input;
        };
    }

    /**
     * @ngdoc filter
     * @name nypl_locations.filter:hoursTodayFormat
     * @param {object} elem ...
     * @returns {string} ...
     * @description
     * ...
     */
    function hoursTodayFormat() {
        'use strict';
        function getHoursObject(time) {
            time = time.split(':');
            return _.object(
                ['hours', 'mins', 'meridian', 'military'],
                [((parseInt(time[0], 10) + 11) % 12 + 1),
                    time[1],
                    (time[0] >= 12 ? ' PM' : ' AM'),
                    parseInt(time[0], 10)]
            );
        }

        return function (elem) {
            // Not sure yet if this will suffice to get the dynamic
            // hours today
            // moment().get('hours'); or get('hour')??

            var open_time, closed_time,
                now = moment(),
                today, tomorrow,
                tomorrow_open_time, tomorrow_close_time,
                tomorrows_alert, hour_now_military = now.get('hour');

            // If truthy async check
            if (elem) {
                today = elem.today;
                tomorrow = elem.tomorrow;

                // If there are no open or closed times for today's object
                // Then default to return 'Closed Today' with proper error log
                if (!today.open || !today.close) {
                    console.log("Obj is undefined for open/close properties");
                    return 'Closed today';
                }

                // Assign open time obj
                if (today.open) {
                    open_time = getHoursObject(today.open);
                }

                // Assign closed time obj
                if (today.close) {
                    closed_time = getHoursObject(today.close);
                }

                // Assign alert msg for tomorrow if defined
                if (tomorrow.alert !== null) {
                    tomorrows_alert = tomorrow.alert.closed_for || null;
                }

                // Assign tomorrow's open time object
                if (tomorrow.open !== null) {
                    tomorrow_open_time = getHoursObject(tomorrow.open);
                }

                // Assign tomorrow's closed time object
                if (tomorrow.close !== null) {
                    tomorrow_close_time = getHoursObject(tomorrow.close);
                }

                // If the current time is past today's closing time but
                // before midnight, display that it will be open 'tomorrow',
                // if there is data for tomorrow's time.
                if (hour_now_military >= closed_time.military) {

                    // If an alert is set for tomorrow, display that first
                    // before displaying the hours for tomorrow
                    if (tomorrows_alert) {
                        return 'Tomorrow: ' + tomorrows_alert;
                    }
                    else if (tomorrow_open_time && tomorrow_close_time) {
                        return 'Open tomorrow ' + tomorrow_open_time.hours +
                            (parseInt(tomorrow_open_time.mins, 10) !== 0 ? ':' + tomorrow_open_time.mins : '')
                            + tomorrow_open_time.meridian + '-' + tomorrow_close_time.hours +
                            (parseInt(tomorrow_close_time.mins, 10) !== 0 ? ':' + tomorrow_close_time.mins : '')
                            + tomorrow_close_time.meridian;
                    }
                    return 'Closed today';
                }

                // Display a time range if the library has not opened yet
                if (hour_now_military < open_time.military) {
                    return 'Open today ' + open_time.hours +
                        (parseInt(open_time.mins, 10) !== 0 ? ':' + open_time.mins : '')
                        + open_time.meridian + '-' + closed_time.hours +
                        (parseInt(closed_time.mins, 10) !== 0 ? ':' + closed_time.mins : '')
                        + closed_time.meridian;
                }
                // Displays as default once the library has opened
                return 'Open today until ' + closed_time.hours +
                        (parseInt(closed_time.mins, 10) !== 0 ? ':'
                        + closed_time.mins : '')
                        + closed_time.meridian;
            }
            return 'Not available';
        };
    }

    /**
     * @ngdoc filter
     * @name nypl_locations.filter:apStyle
     * @param {string} input ...
     * @returns {string} ...
     * @description
     * Converts time stamps to NYPL AP style
     */
    function apStyle (input, format) {
        if (!input) {
            return '';
        }
        if (!format) {
            return input;
        }
        if (format === 'time') {
            return apTime(input);
        }
        if (format === 'date') {
            return apDate(input);
        }
        if (format === 'day') {
            return apDay(input);
        }
        if (format === 'month' ) {
            return apMonth(input);
        }

        function apTime (input) {
            var timeArray = input.split(':'),
                militaryHour = parseInt(timeArray[0], 10),
                hour = (militaryHour + 11) % 12 + 1,
                minute = (timeArray[1] === '00') ? '' : ':' + timeArray[1],
                meridiem = (militaryHour >= 12) ? ' PM' : ' AM';

            return hour + minute + meridiem;
        }

        function apDate (input) {
            var date = parseInt(input, 10).toString();

            return date;
        }

        function apDay (input) {
            var day = input.split('.')[0].slice(0, 3);

            if (day === 'Tue') {
                return 'Tues';
            }
            if (day ==='Thu') {
                return 'Thurs';
            }
            return day;
        }

        function apMonth (input) {
            var month = input.slice(0, 3);

            if (month === 'Jun') {
                return 'June';
            }
            if (month === 'Jul') {
                return 'July';
            }
            if (month === 'Sep') {
                return 'Sept';
            }
            return month;
        }
    }

    /**
     * @ngdoc filter
     * @name nypl_locations.filter:truncate
     * @param {string} text ...
     * @param {number} [length] ...
     * @returns {string} [end] ...
     * @description
     * ...
     */
    function truncate() {
        return function (text, length, end) {
            if (typeof text !== 'string') {
                return text;
            }

            if (text.length < 200) {
                return text;
            }

            if (isNaN(length)) {
                length = 200; // Default length
            }
            if (end === undefined) {
                end = "..."; // Default ending characters
            }

            if (text.length <= length || text.length - end.length <= length) {
                return text;
            }

            return String(text).substring(0, length - end.length) + end;
        };
    }

    function slugify() {
        return function (text) {
            return text.replace(/\s+/g, '-').toLowerCase();
        };
    }

    function unslugify() {
        return function (text) {
            return capitalize()(text.replace(/\-/g, ' '));
        };
    }

     angular
        .module('nypl_research_collections')
        .filter('timeFormat', timeFormat)
        .filter('dateToISO', dateToISO)
        .filter('capitalize', capitalize)
        .filter('hoursTodayFormat', hoursTodayFormat)
        .filter('truncate', truncate)
        .filter('slugify', slugify)
        .filter('unslugify', unslugify);
})();

/*jslint nomen: true, indent: 2, maxlen: 80, browser: true */
/*globals nypl_locations, angular, console, $window, _ */

(function () {
  'use strict';

  /**
   * @ngdoc service
   * @name nypl_locations.service:researchService
   * @description
   * ...
   */
  researchCollectionService.$inject = ["$filter"];
  function researchCollectionService($filter) {
    var researchService = {},
      researchValues = {};

    /**
     * @ngdoc function
     * @name setResearchValue
     * @methodOf nypl_locations.service:researchService
     * @param {string} prop ...  
     * @param {string} val ...
     * @returns {object} ...
     * @description
     * ...
     */
    researchService.setResearchValue = function (prop, val) {
      researchValues[prop] = val;
      return this;
    };

    /**
     * @ngdoc function
     * @name getResearchValues
     * @methodOf nypl_locations.service:researchService
     * @returns {object} ...
     * @description
     * ...
     */
    researchService.getResearchValues = function () {
      return researchValues;
    };

    /**
     * @ngdoc function
     * @name resetResearchValues
     * @methodOf nypl_locations.service:researchService
     * @returns {object} ...
     * @description
     * ...
     */
    researchService.resetResearchValues = function () {
      researchValues = {};
      return this;
    };

    return researchService;
  }

  angular
    .module('nypl_research_collections')
    .factory('researchCollectionService', researchCollectionService);

})();

/*jslint nomen: true, indent: 2, maxlen: 80, browser: true */
/*globals nypl_locations, angular, console, $window, _ */

(function () {
  'use strict';

  /**
   * @ngdoc service
   * @name nypl_locations.service:requestNotificationChannel
   * @requires $rootScope
   * @description
   * Credit: Jim Lasvin -- https://github.com/lavinjj/angularjs-spinner
   */
  nyplUtility.$inject = ["$sce", "$window", "nyplCoordinatesService"];
  requestNotificationChannel.$inject = ["$rootScope"];
  function requestNotificationChannel($rootScope) {
    // private notification messages
    var _START_REQUEST_ = '_START_REQUEST_',
      _END_REQUEST_ = '_END_REQUEST_',
      notificationChannel = {};

    // publish start request notification
    notificationChannel.requestStarted = function () {
      $rootScope.$broadcast(_START_REQUEST_);
    };

    // publish end request notification
    notificationChannel.requestEnded = function () {
      $rootScope.$broadcast(_END_REQUEST_);
    };

    // subscribe to start request notification
    notificationChannel.onRequestStarted = function ($scope, handler) {
      $scope.$on(_START_REQUEST_, function (event) {
        handler(event);
      });
    };

    // subscribe to end request notification
    notificationChannel.onRequestEnded = function ($scope, handler) {
      $scope.$on(_END_REQUEST_, function (event) {
        handler(event);
      });
    };

    return notificationChannel;
  }

  /**
   * @ngdoc service
   * @name nypl_locations.service:nyplUtility
   * @requires $sce
   * @requires $window
   * @requires nyplCoordinatesService
   * @description
   * AngularJS service with utility functions.
   */
  function nyplUtility($sce, $window, nyplCoordinatesService) {
    var utility = {};

    /**
     * @ngdoc function
     * @name hoursToday
     * @methodOf nypl_locations.service:nyplUtility
     * @param {object} hours Object with a regular property that is an
     *  array with the open and close times for every day.
     * @param {object} alerts Object with an array of alerts pertaining
     *  to each location/division api endpoint.
     * @returns {object} An object with the open/close times for
     *  the today/tomorrow and an alert property for tomorrow's
     *  potential alert.
     * @description ...
     */
    utility.hoursToday = function (hours, alertsObj) {
      var date = new Date(),
        today = date.getDay(),
        tomorrow = today + 1,
        hoursToday,
        alerts,
        alertStartDate,
        tomorrowsAlert;

      if(alertsObj) {
        // Retrieve only global closing alerts
        // Order is established by API
        if (alertsObj.all_closings && alertsObj.all_closings.length) {
          alerts = alertsObj.all_closings;
        }
      }

      if (hours) {
        // Obtain tomorrow's alert
        if (alerts && alerts.length) {
          tomorrowsAlert = _.find(alerts, function(alert){
            if (alert.applies) {
              alertStartDate = moment(alert.applies.start);
              // Priority: 1) Global 2) Location 3) Division
              if (alert.scope === 'all' && alertStartDate.day() === tomorrow) {
                return alert;
              } else if (alert.scope === 'location' && alertStartDate.day() === tomorrow) {
                return alert;
              }
              return alert.scope === 'division' && alertStartDate.day() === tomorrow;
            }
          });
        }

        hoursToday = {
          'today': {
            'day': hours.regular[today].day,
            'open': hours.regular[today].open,
            'close': hours.regular[today].close
          },
          'tomorrow': {
            'day': hours.regular[tomorrow % 7].day,
            'open': hours.regular[tomorrow % 7].open,
            'close': hours.regular[tomorrow % 7].close,
            'alert' : tomorrowsAlert || null
          }
        };
      }
      return hoursToday;
    };

    /**
     * @ngdoc function
     * @name formatDate
     * @methodOf nypl_locations.service:nyplUtility
     * @param {string} startDate ...
     * @param {string} endDate ...
     * @returns {string} ...
     * @description ...
     */
    utility.formatDate = function(startDate, endDate) {
      var formattedDate,
          months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

      this.numDaysFromToday = function(date, today) {
        return Math.round(((date.valueOf()-today.valueOf()) / 1000 / 86400) - 0.5);
      };

      if (startDate && endDate) {
        var sDate = new Date(startDate),
          eDate   = new Date(endDate),
          today   = new Date(),
          nDays   = this.numDaysFromToday(eDate, today);

        if (!nDays) return;
        // First check if input is within 365 days
        if (nDays <= 365) {
          // Millisecond comparison between date.time property
          if (sDate.getTime() <= today.getTime() && eDate.getTime() >= today.getTime()) {
            // Current Event
            formattedDate = "Now through " + months[eDate.getUTCMonth()] + " " +
                            eDate.getUTCDate() + ", " + eDate.getUTCFullYear();
          }
          else if (sDate.getTime() > today.getTime() && eDate.getTime() >= today.getTime()) {
            // Upcoming Event
            formattedDate = "Opening " + months[sDate.getUTCMonth()] + " " +
                            sDate.getUTCDate() + ", " + sDate.getUTCFullYear();
          }
          else {
            // Past Event
            formattedDate = months[sDate.getUTCMonth()] + " " + sDate.getUTCDate() + ", " + 
                            sDate.getUTCFullYear() + " through " + months[eDate.getUTCMonth()] +
                            " " + eDate.getUTCDate() + ", " + eDate.getUTCFullYear();
          }
        }
        else {
          formattedDate = "Ongoing";
        }
      }
      return formattedDate;
    }

    /**
     * @ngdoc function
     * @name branchException
     * @methodOf nypl_locations.service:nyplUtility
     * @param {object} hours ...
     * @returns {object} ...
     * @description Parse exception data and return as string
     */
    utility.branchException = function (hours) {
      var exception = {};

      if (hours) {
        // If truthy, data exist for existing location
        if (!hours.exceptions) {
          return null;
        }
        if (hours.exceptions.description.trim() !== '') {
          exception.desc = hours.exceptions.description;
          // Optional set
          if (hours.exceptions.start) {
            exception.start = hours.exceptions.start;
          }
          if (hours.exceptions.end) {
            exception.end = hours.exceptions.end;
          }
          return exception;
        }
      }

      return null;
    };

    /**
     * @ngdoc function
     * @name getAddressString
     * @methodOf nypl_locations.service:nyplUtility
     * @param {object} location The full location object.
     * @param {boolean} [nicePrint] False by default. If true is passed,
     *  the returned string will have HTML so it displays nicely in a
     *  Google Maps marker infowindow.
     * @returns {string} The formatted address of the location passed.
     *  Will contain HTML if true is passed as the second parameter,
     *  with the location name linked.
     * @description ...
     */
    utility.getAddressString = function (location, nicePrint) {
      if (!location) {
        return '';
      }

      var addressBreak = " ",
        linkedName = location.name;

      if (nicePrint) {
        addressBreak = "<br />";
        linkedName = "<a href='/locations/" + location.slug +
          "'>" + location.name + "</a>";
      }

      return linkedName + addressBreak +
        location.street_address + addressBreak +
        location.locality + ", " +
        location.region + ", " +
        location.postal_code;
    };

    /**
     * @ngdoc function
     * @name socialMediaColor
     * @methodOf nypl_locations.service:nyplUtility
     * @param {object} social_media ...
     * @description ...
     */
    utility.socialMediaColor = function (social_media) {
      _.each(social_media, function (sc) {
        sc.classes = 'icon-';
        switch (sc.site) {
        case 'facebook':
          sc.classes += sc.site + ' blueDarkerText';
          break;
        case 'foursquare':
          sc.classes += sc.site + ' blueText';
          break;
        case 'instagram':
          sc.classes += sc.site + ' blackText';
          break;
        // Twitter and Tumblr have a 2 in their icon class
        // name: icon-twitter2, icon-tumblr2
        case 'twitter':
          sc.classes += sc.site + '2 blueText';
          break;
        case 'tumblr':
          sc.classes += sc.site + '2 indigoText';
          break;
        case 'youtube':
        case 'pinterest':
          sc.classes += sc.site + ' redText';
          break;
        default:
          sc.classes += sc.site;
          break;
        }
      });

      return social_media;
    };

    /**
     * @ngdoc function
     * @name popupWindow
     * @methodOf nypl_locations.service:nyplUtility
     * @param {string} link ...
     * @param {string} title ...
     * @param {string} width ...
     * @param {string} height ...
     * @description
     * Utility service function that opens a new window given a URL.
     * width (Int or String), height (Int or String)
     */
    utility.popupWindow = function (link, title, width, height) {
      var w, h, popUp, popUp_h, popUp_w;

      if (!link) {
        return;
      }

      // Set width from args, defaults 300px
      if (width === undefined) {
        w = '300';
      } else if (typeof width === 'string' || width instanceof String) {
        w = width;
      } else {
        w = width.toString(); // convert to string
      }

      // Set height from args, default 500px;
      if (height === undefined) {
        h = '500';
      } else if (typeof width === 'string' || width instanceof String) {
        h = height;
      } else {
        h = height.toString(); // convert to string
      }

      // Check if link and title are set and assign attributes
      if (link && title) {
        popUp = $window.open(
          link,
          title,
          "menubar=1,resizable=1,width=" + w + ",height=" + h
        );
      } else if (link) {
        // Only if link is set, default title: ''
        popUp = $window.open(
          link,
          "",
          "menubar=1,resizable=1,width=" + w + ",height=" + h
        );
      }

      // Once the popup is set, center window
      if (popUp) {
        popUp_w = parseInt(w, 10);
        popUp_h = parseInt(h, 10);

        popUp.moveTo(
          screen.width / 2 - popUp_w / 2,
          screen.height / 2 - popUp_h / 2
        );
      }
    };

    /**
     * @ngdoc function
     * @name calendarLink
     * @methodOf nypl_locations.service:nyplUtility
     * @param {string} type ...
     * @param {object} event ...
     * @param {object} location ...
     * @description ...
     */
    utility.calendarLink = function (type, event, location) {
      if (!type || !event || !location) {
        return '';
      }
      var title = event.title,
        start_date = event.start.replace(/[\-:]/g, ''),
        end_date = event.end.replace(/[\-:]/g, ''),
        body = event.body,
        url = event._links.self.href,
        address = location.name + " - " +
          location.street_address + " " +
          location.locality + ", " + location.region +
          " " + location.postal_code,
        calendar_link = '';

      switch (type) {
      case 'google':
        calendar_link = "https://www.google.com/calendar" +
          "/render?action=template" +
          "&text=" + title +
          "&dates=" + start_date + "/" + end_date +
          "&details=" + body +
          "&location=" + address +
          "&pli=1&uid=&sf=true&output=xml";
        break;
      case 'yahoo':
        calendar_link = "https://calendar.yahoo.com/?v=60" +
          "&TITLE=" + title +
          "&ST=" + start_date +
          "&in_loc=" + address +
          "&in_st=" + address +
          "&DESC=" + body +
          "&URL=" + url;
        break;
      default:
        break;
      }

      return calendar_link;
    };

    /**
     * @ngdoc function
     * @name icalLink
     * @methodOf nypl_locations.service:nyplUtility
     * @param {object} event ...
     * @param {object} address ...
     * @description ...
     */
    utility.icalLink = function (event, address) {
      if (!event || !address) {
        return '';
      }
      var currentTime = new Date().toJSON().toString().replace(/[\-.:]/g, ''),
        url = "http://nypl.org/" + event._links.self.href,
        icsMSG = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NYPL//" +
          "NONSGML v1.0//EN\n" +
          "METHOD:PUBLISH\n" +
          "BEGIN:VEVENT\n" +
          "UID:" + new Date().getTime() +
          "\nDTSTAMP:" + currentTime + "\nATTENDEE;CN=My Self ;" +
          "\nORGANIZER;CN=NYPL:" +
          "\nDTSTART:" + event.start.replace(/[\-:]/g, '') +
          "\nDTEND:" + event.end.replace(/[\-:]/g, '') +
          "\nLOCATION:" + address +
          "\nDESCRIPTION:" + event.body +
          "\nURL;VALUE=URI:" + url +
          "\nSUMMARY:" + event.title +
          "\nEND:VEVENT\nEND:VCALENDAR",
        icalLink = 'data:text/calendar;chartset=utf-8,' + encodeURI(icsMSG);

      $window.open(icalLink);
      return icalLink;
    };

    /**
     * @ngdoc function
     * @name isMobile
     * @methodOf nypl_locations.service:nyplUtility
     * @description Helper function that checks browser viewport
     * based off 480px to determine if it is a mobile device.
     */
    utility.isMobile = function () {
      var mobileView = $window.matchMedia("(min-width: 480px)");
      return (mobileView.matches) ? false : true;
    };

    /**
     * @ngdoc function
     * @name calcDistance
     * @methodOf nypl_locations.service:nyplUtility
     * @param {object} locations ...
     * @param {object} coords ...
     * @description
     * Iterate through lon/lat and calculate distance
     */
    utility.calcDistance = function (locations, coords) {
      if (!locations) {
        return [];
      }

      var searchCoordinates = {
        latitude: coords.latitude || coords.lat,
        longitude: coords.longitude || coords.long
      };

      _.each(locations, function (location) {
        var locCoords = [], locationLat, locationLong;

        if (location.geolocation && location.geolocation.coordinates) {
          locCoords = location.geolocation.coordinates;
        }

        locationLat = location.lat || locCoords[1];
        locationLong = location.long || locCoords[0];

        location.distance = nyplCoordinatesService.getDistance(
          searchCoordinates.latitude,
          searchCoordinates.longitude,
          locationLat,
          locationLong
        );
      });

      return locations;
    };

    /**
     * @ngdoc function
     * @name checkDistance
     * @methodOf nypl_locations.service:nyplUtility
     * @param {array} locations An array with all the locations objects.
     * @returns {boolean} True if the minimum distance property from each
     *  location is more than 25 (miles). False otherwise.
     * @description An array of distance values is created from the distance
     *  property of each location. If the minimum distance is more than 25 miles
     *  we return true; used when we want to check if we want to continue
     *  searching or manipulating the locations.
     */
    utility.checkDistance = function (locations) {
      var distanceArray = _.pluck(locations, 'distance');

      if (_.min(distanceArray) > 25) {
        return true;
      }
      return false;
    };

    /**
     * @ngdoc function
     * @name returnHTML
     * @methodOf nypl_locations.service:nyplUtility
     * @param {string} html A string containing HTML that should be rendered.
     * @returns {string} A trusted string with renderable HTML used in
     *  AngularJS' markup binding.
     * @description Using the ngSanitize module to allow markup in a string.
     *  The second step is to use ng-bind-html="..." to display the
     *  trusted HTMl.
     */
    utility.returnHTML = function (html) {
      return $sce.trustAsHtml(html);
    };

    /**
     * @ngdoc function
     * @name divisionHasAppointment
     * @methodOf nypl_locations.service:nyplUtility
     * @param {string} id The id of a division.
     * @returns {boolean} True if the division is in the set that should have
     *  appointments, false otherwise.
     * @description Only a few divisions should have a link to make
     *  an appointment.
     */
    utility.divisionHasAppointment = function (divisionsWithApts, id) {
      return _.contains(divisionsWithApts, id);
    };

    /**
     * @ngdoc function
     * @name researchLibraryOrder
     * @methodOf nypl_locations.service:nyplUtility
     * @param {array} research_order ...
     * @param {string} id The id of a branch.
     * @returns {number} ...
     * @description ..
     */
    utility.researchLibraryOrder = function (research_order, id) {
      return _.indexOf(research_order, id);
    };

    return utility;
  }

   angular
    .module('nypl_research_collections')
    .factory('nyplUtility', nyplUtility)
    .factory('requestNotificationChannel', requestNotificationChannel);

})();

