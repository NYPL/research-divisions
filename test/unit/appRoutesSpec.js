/*jslint nomen: true, unparam: true, indent: 2, maxlen: 80 */
/*globals element, by, module, module, window, jasmine,
describe, expect, beforeEach, inject, it, angular, spyOn */

describe('Researchinator State Routing', function () {
  'use strict';

  var $rootScope, $injector, $state, $httpBackend, nyplLocationsService,
    configObj = {
      api_root: 'http://dev.refinery.aws.nypl.org/api/nypl/locations',
      featured_amenities: { global: 3, local: 2 }
    };

  function testStateConfig(stateConfig, expectedConfig) {
    expect(stateConfig.url).toEqual(expectedConfig.url);
    expect(stateConfig.abstract).toBe(expectedConfig.abstract);
    expect(stateConfig.templateUrl).toEqual(expectedConfig.templateUrl);
    expect(stateConfig.controller).toEqual(expectedConfig.controller);
    expect(stateConfig.label).toEqual(expectedConfig.label);
  }

  describe('Researchinator', function () {
    beforeEach(function () {
      module('nypl_research_collections', function ($provide) {
        // $provide.value('config', config = {});
        $provide.value('nyplLocationsService', nyplLocationsService = {});
        nyplLocationsService.getConfig = jasmine.createSpy('getConfig')
          .and.returnValue(configObj);
      });

      inject(function (_$rootScope_, _$state_, _$injector_, _$httpBackend_) {
        $state = _$state_;
        $rootScope = _$rootScope_.$new();
        $injector = _$injector_;
        // $httpBackend = _$httpBackend_;

        // $httpBackend.expectGET('views/404.html').respond(200, '/views');
        // $httpBackend
        //   .expectGET('languages/en.json')
        //   .respond('public/languages/en.json');
      });
    });

    describe('Router configuration', function () {
      var state, stateConfig, expectedConfig;

      it('should return the homepage state', function () {
        state = 'home';
        stateConfig = $state.get(state);
        expectedConfig = {
          url: '/',
          abstract: undefined,
          templateUrl: 'views/research-collections.html',
          controller: 'CollectionsCtrl',
          label: 'Research Collections'
        };

        testStateConfig(stateConfig, expectedConfig);
        expect($injector.invoke(stateConfig.resolve.config)).toEqual(configObj);
      });

      
      it('should return the 404 state', function () {
        state = 'lost';
        stateConfig = $state.get(state);
        expectedConfig = {
          url: '/404',
          abstract: undefined,
          templateUrl: 'views/404.html',
          controller: undefined,
          label: undefined
        };

        testStateConfig(stateConfig, expectedConfig);
        expect(stateConfig.resolve).not.toBeDefined();
      });

    });

    describe('Router URLs', function () {
      it('should go to the home page', function () {
        expect($state.href('home')).toEqual('/');
      });
    });
  });

});
