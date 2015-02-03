/*jslint nomen: true, unparam: true, indent: 2, maxlen: 80 */
/*globals element, by, module, module, window, jasmine,
describe, expect, beforeEach, inject, it, angular, spyOn */

describe('Locinator State Routing', function () {
  'use strict';

  var $rootScope, $injector, $state, $httpBackend, nyplLocationsService,
    configObj = {
      api_root: 'dev.locations.api.nypl.org',
      featured_amenities: { global: 3, local: 2 }
    };

  function testStateConfig(stateConfig, expectedConfig) {
    expect(stateConfig.url).toEqual(expectedConfig.url);
    expect(stateConfig.abstract).toBe(expectedConfig.abstract);
    expect(stateConfig.templateUrl).toEqual(expectedConfig.templateUrl);
    expect(stateConfig.controller).toEqual(expectedConfig.controller);
    expect(stateConfig.label).toEqual(expectedConfig.label);
  }

  describe('Locinator', function () {
    beforeEach(function () {
      module('nypl_research_collections', function ($provide) {
        $provide.value('config', config = {});
        $provide.value('nyplLocationsService', nyplLocationsService = {});
        nyplLocationsService.getConfig = jasmine.createSpy('getConfig')
          .and.returnValue(configObj);
        nyplLocationsService.singleDivision =
          jasmine.createSpy('singleDivision')
          .and.returnValue({division: 'Map Division'});
        nyplLocationsService.amenities = jasmine.createSpy('amenities')
          .and.returnValue({amenities: 'amenities'});
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
          abstract: true,
          templateUrl: 'views/locations.html',
          controller: 'LocationsCtrl',
          label: 'Locations'
        };

        testStateConfig(stateConfig, expectedConfig);
        expect($injector.invoke(stateConfig.resolve.config)).toEqual(configObj);
      });

      
      it('should return the 404 state', function () {
        state = '404';
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

      it('should go to the list page', function () {
        expect($state.href('home.list')).toEqual('/list');
      });

      it('should go to the map page', function () {
        expect($state.href('home.map')).toEqual('/map');
      });

      it('should go to a subdivision page', function () {
        expect($state.href('subdivision', {
          division: 'general-research-division',
          subdivision: 'periodicals-room'
        })).toEqual('/divisions/general-research-division/periodicals-room');
      });

      it('should go to a division page', function () {
        expect($state.href('division', {division: 'map-division'}))
          .toEqual('/divisions/map-division');
      });

      it('should go to the all amenities page', function () {
        expect($state.href('amenities')).toEqual('/amenities');
      });

      it('should go to an amenity page', function () {
        expect($state.href('amenity', {amenity: '7950'}))
          .toEqual('/amenities/id/7950');
      });

      it('should go to an amenities at location page', function () {
        expect($state.href(
          'amenities-at-location',
          {location: 'grand-central'}
        )).toEqual('/amenities/loc/grand-central');
      });

      it('should go to a 404 page', function () {
        expect($state.href('404')).toEqual('/404');
      });

      it('should go to a location page', function () {
        expect($state.href('location', {location: 'schwarzman'}))
          .toEqual('/schwarzman');
      });
    });
  });

});
