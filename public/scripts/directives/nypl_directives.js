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
