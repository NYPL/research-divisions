/*jslint nomen: true, unparam: true, indent: 2, maxlen: 80 */
/*globals element, by, module, module,
describe, expect, beforeEach, inject, it, angular */

/*
 * The following tests are for custom AngularJS filters.
 */
describe('NYPL Filter Unit Tests', function () {
  'use strict';

  // Load App dependency
  var timeFormatFilter;

  beforeEach(module('nypl_research_collections'));

  /*
   * {object} | timeFormat
   *   Input is an object with 'open' and 'close' properties OR
   *   it can be an object with 'today' and 'tomorrow' properties, each with
   *   their own 'open' and 'close' properties.
   *
   *   Returns a string of nicely military-formatted time. If there is
   *   no open time in the input object, 'Closed' is returned.
   */
  describe('Filter: timeFormat', function () {
    beforeEach(inject(function (_timeFormatFilter_) {
      timeFormatFilter = _timeFormatFilter_;
    }));

    it('should have a timeFormat function', function () {
      expect(timeFormatFilter).toBeDefined();
      expect(angular.isFunction(timeFormatFilter)).toBe(true);
    });

    // The input is a simple object with 'open' and 'close' properties
    it('should convert Military time into standard time', function () {
      expect(timeFormatFilter({'open': '12:00', 'close': '18:00'}))
        .toEqual('12 PM–6 PM');
      expect(timeFormatFilter({'open': '03:30', 'close': '05:30'}))
        .toEqual('3:30 AM–5:30 AM');
      expect(timeFormatFilter({'open': '00:30', 'close': '02:30'}))
        .toEqual('12:30 AM–2:30 AM');
      expect(timeFormatFilter({'open': '00:00', 'close': '2:00'}))
        .toEqual('12 AM–2 AM');
    });

    // The input is an object with 'today' and 'tomorrow' properties but only
    // the 'today' property is used.
    it('should also accept an object with today\'s and tomorrow\'s hours',
      function () {
        expect(timeFormatFilter({'today': {'open': '00:00', 'close': '2:00'}}))
          .toEqual('12 AM–2 AM');

        expect(timeFormatFilter({'today': {'open': '10:00', 'close': '18:00'}}))
          .toEqual('10 AM–6 PM');
      });

    // The API returns null values
    it('should say Closed if there is no open time', function () {
      expect(timeFormatFilter({'open': null, 'close': null})).toEqual('Closed');
    });

    it('should be false if input is NOT given', function () {
      expect(timeFormatFilter()).toEqual('');
      expect(timeFormatFilter()).toBeFalsy();
    });
  });
});
