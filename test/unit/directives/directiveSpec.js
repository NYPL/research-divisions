/*jslint nomen: true, unparam: true, indent: 2, maxlen: 80 */
/*globals element, by, module, module, window, jasmine,
describe, expect, beforeEach, inject, it, angular */

/*
 * Tests for AngularJS Directives.
 */
describe('NYPL Directive Unit Tests', function () {
  'use strict';

  var httpBackend, compile, scope,
    api = 'https://dev-refinery.nypl.org/api/nypl/ndo',
    api_version = 'v0.1',
    jsonpCallback = '?callback=JSON_CALLBACK';

  beforeEach(function () {
    module('nypl_research_collections');
    module('directiveTemplates');

    window.locations_cfg = {
      config: {
        api_root: api,
        api_version: api_version,
        fundraising: {
          statement: "Become a Member",
          appeal: "Friends of the Library can support their favorite " +
            "library and receive great benefits!",
          button_label: "Join or Renew",
          link: "https://secure3.convio.net/nypl/site/SPageServer?page" +
            "name=branch_friend_form&s_src=FRQ15ZZ_CADN"
        }
      }
    };

    inject(function (_$httpBackend_, _$compile_, _$rootScope_) {
      httpBackend = _$httpBackend_;
      compile = _$compile_;
      scope = _$rootScope_.$new();
    });
  });

  function createDirective(template) {
    var element;
    element = compile(template)(scope);
    scope.$digest();

    return element;
  }

  /*
   * <div loading-widget></div>
   *   The loadingWidget directive is markup that displays before
   *   an http request is fulfilled, in this case showing a spinner.
   */
  describe('Directive: loadingWidget', function () {
    var loadingWidget, template;

    beforeEach(inject(function () {
      template = '<div id="loadingWidget" loading-widget class="show">' +
        '<div class="loader-icon icon-spinner2"></div></div>';
      loadingWidget = createDirective(template);
    }));

    it('should compile', function () {
      expect(loadingWidget.attr('id')).toEqual('loadingWidget');
    });

    it('should remove the show class initially', function () {
      expect(loadingWidget.attr('class')).not.toContain('show');
    });
  });

  /*
   * <nypl-translate><nypl-translate>
   *   The nyplTranslate directive displays a simple list
   *   of languages that the site can be translated into.
   */
  // NOTE: TEMPORARILY NOT BEING USED
  // describe('Directive: nyplTranslate', function () {
  //   var nyplTranslate, template, $translate, englishLink, spanishLink;

  //   beforeEach(inject(function (_$translate_) {
  //     $translate = _$translate_;
  //     $translate.use = jasmine.createSpy('$translate.use');

  //     template = '<nypl-translate></nypl-translate>';
  //     nyplTranslate = createDirective(template);

  //     englishLink = nyplTranslate.find('a')[0];
  //     spanishLink = nyplTranslate.find('a')[1];
  //   }));

  //   it('should have a translate class', function () {
  //     expect(nyplTranslate.attr('class')).toContain('translate');
  //   });

  //   // At the time of writing this test, we only have two languages
  //   it('should have two spans elements', function () {
  //     expect(nyplTranslate.find('span').length).toBe(2);
  //   });

  //   it('should display the Spanish translation', function () {
  //     spanishLink.click();

  //     expect($translate.use).toHaveBeenCalledWith('es');
  //   });

  //   it('should display the English translation', function () {
  //     englishLink.click();

  //     expect($translate.use).toHaveBeenCalledWith('en');
  //   });
  // });


  /*
   * <div scrolltop></div>
   */
  describe('Directive: scrolltop', function () {
    var scrolltop, template, $state;

    beforeEach(inject(function (_$state_) {
      $state = _$state_;
      window.scrollTo = jasmine.createSpy('window.scrollTo');

      template = '<div scrolltop></div>';
      scrolltop = createDirective(template);
    }));

    it('should scroll to the top on state change', function () {
      $state.go('home');

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });
  });


  /*
   * <nypl-site-alerts></nypl-site-alerts>
   *   The nyplSiteAlerts directive displays a site-wide alert by checking all
   *   the alerts in the API and checking the current date.
   */
  // describe('Directive: nyplSiteAlerts', function () {
  //   var $httpBackend, date, template, nyplSiteAlerts, $timeout, MockDate, alert;

  //   beforeEach(inject(function (_$httpBackend_, _$timeout_) {
  //     $timeout = _$timeout_;
  //     $httpBackend = _$httpBackend_;
  //   }));

  //   it('should display a current site wide alert', function () {
  //     // Override the date function so we can test a real alert
  //     // Store a copy so we can return the original one later
  //     date = new Date(2014, 5, 29);
  //     MockDate = Date;
  //     Date = function () { return date; };

  //     $httpBackend
  //       .whenJSONP(api + '/' + api_version + '/alerts' + jsonpCallback)
  //       .respond({
  //         alerts: [{
  //           _id: "71579",
  //           scope: "all",
  //           title: "Independence Day",
  //           body: "All units of the NYPL are closed July 4 - July 5.",
  //           start: "2014-06-27T00:00:00-04:00",
  //           end: "2014-07-06T01:00:00-04:00"
  //         }]
  //       });

  //     template = "<nypl-site-alerts></nypl-site-alerts>";
  //     nyplSiteAlerts = createDirective(template);

  //     $timeout.flush();
  //     $httpBackend.flush();

  //     // Currently just using the value in the scope.
  //     alert = scope.sitewidealert;
  //     expect(alert)
  //       .toEqual(['All units of the NYPL are closed July 4 - July 5.']);

  //     // Use the native Date function again
  //     Date = MockDate;
  //   });

  //   it('should not display a site wide alert - future alert', function () {
  //     $httpBackend
  //       .whenJSONP(api + '/' + api_version + '/alerts' + jsonpCallback)
  //       .respond({
  //         alerts: [{
  //           _id: "71579",
  //           scope: "all",
  //           title: "Independence Day",
  //           body: "All units of the NYPL are closed July 4 - July 5.",
  //           start: "2016-06-27T00:00:00-04:00",
  //           end: "2016-07-06T01:00:00-04:00"
  //         }]
  //       });

  //     template = "<nypl-site-alerts></nypl-site-alerts>";
  //     nyplSiteAlerts = createDirective(template);

  //     $timeout.flush();
  //     $httpBackend.flush();

  //     // Currently just using the value in the scope.
  //     alert = scope.sitewidealert;
  //     expect(alert).toEqual([]);
  //   });
  // });


  /*
   * <div class="weekly-hours" collapse="expand" duration="2500"></div>
   *   The collapse directive creates a slide toggle animation for an element.
   */
  describe('Directive: collapse', function () {
    var collapse, template;

    beforeEach(inject(function () {
      template = '<div class="weekly-hours" collapse="expand"></div>';
      collapse = createDirective(template);
    }));

    it('should open and close the element by hiding it', function () {
      // Initially on load it is false and hidden.
      scope.expand = false;
      scope.$digest();

      expect(collapse.attr('class')).not.toContain('open');
      expect(collapse.attr('style')).toEqual('display: none;');

      // When clicked, it slides down.
      scope.expand = true;
      scope.$digest();

      expect(collapse.attr('class')).toContain('open');
      expect(collapse.attr('style')).toContain('display: block;');
    });
  });


  /*
   * <nypl-foot></nypl-footer>
   */
  describe('Directive: nyplFooter', function () {
    var nyplFooter, template, $httpBackend;

    beforeEach(inject(function (_$httpBackend_) {
      $httpBackend = _$httpBackend_;

      template = '<nypl-footer></nypl-footer>';
      nyplFooter = createDirective(template);
    }));

    it('should compile', function () {
      expect(nyplFooter.find('.copyright').length).toBe(1);
      expect(nyplFooter.find('.footerlinks ul').length).toBe(4);
    });

    it('should trigger click', function () {
      nyplFooter.find('.footerlinks a').click();
    });
  });

});
