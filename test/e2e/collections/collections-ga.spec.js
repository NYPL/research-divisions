/*jslint indent: 2, maxlen: 80 */
/*global describe, require, beforeEach, browser, it,
console, protractor, expect, element, by */

describe('Research Collections: Google Analytics', function () {
  'use strict';

  var collectionsPage = require('./collections.po.js'),
    subjectsFilter,
    mediaFilter,
    locationFilter;

  function mockGA() {
    return "window.ga_msg = [];" +
           "ga = function () {" +
           "  var msg = [];" +
           "  for (var i = 0; i < arguments.length; i++) {" +
           "    msg.push(arguments[i]); " +
           "  }" +
           "  window.ga_msg.push(msg);" +
           "}";
  }

  beforeEach(function () {
    subjectsFilter = element(by.buttonText('Subjects'));
    mediaFilter = element(by.buttonText('Media'));
    locationFilter = element(by.buttonText('Locations'));
  });

  // Structure of pageview array for angularitics plugin
  // ['send', 'pageview', 'URL']
  // describe('Page view tracking', function () {
  //   it('should track a page view', function () {
  //     browser.get('/');
  //     browser.waitForAngular();
  //     browser.executeScript(mockGA());

  //     browser.executeScript('return window.ga_msg;').then(function (ga) {
  //       console.log(ga);
  //       expect(ga[0][1]).toEqual('pageview');
  //       expect(ga[0][2]).toEqual('/research-collections');
  //     });
  //   });
  // });

  // Structure of event array for angularitics plugin
  // ['send', 'event', {eventLabel: '', eventAction: '', eventCategory: ''}]
  // Therefore need to retrieve the third element of the array.
  describe('Event tracking', function () {
    beforeEach(function () {
      browser.get('/');
      browser.waitForAngular();
      browser.executeScript(mockGA());
    });

    describe('Main Filters', function () {
      it('should track a click event on the Subjects filter', function () {
        subjectsFilter.click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[0][2].eventCategory).toEqual('Research Collections');
          expect(ga[0][2].eventAction).toEqual('Main Filter');
          expect(ga[0][2].eventLabel).toEqual('Subjects');
        });
      });

      it('should track a click event on the Media filter', function () {
        mediaFilter.click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[0][2].eventCategory).toEqual('Research Collections');
          expect(ga[0][2].eventAction).toEqual('Main Filter');
          expect(ga[0][2].eventLabel).toEqual('Media');
        });
      });

      it('should track a click event on the Locations filter', function () {
        locationFilter.click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[0][2].eventCategory).toEqual('Research Collections');
          expect(ga[0][2].eventAction).toEqual('Main Filter');
          expect(ga[0][2].eventLabel).toEqual('Locations');
        });
      });
    });

    describe('Subject Filters', function () {
      beforeEach(function () {
        subjectsFilter.click();
      });

      describe('Parent Terms', function () {
        it('should track a click on Social Sciences parent term', function () {
          element(by.linkText('Social Sciences')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[1][2].eventCategory).toEqual('Research Collections');
            expect(ga[1][2].eventAction).toEqual('Click');
            expect(ga[1][2].eventLabel).toEqual('Subjects: Social Sciences');
          });
        });

        it('should track a click on Cultural Studies parent term', function () {
          element(by.linkText('Cultural Studies')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[1][2].eventCategory).toEqual('Research Collections');
            expect(ga[1][2].eventAction).toEqual('Click');
            expect(ga[1][2].eventLabel).toEqual('Subjects: Cultural Studies');
          });
        });

        it('should track a click on Literature parent term', function () {
          element(by.linkText('Literature')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[1][2].eventCategory).toEqual('Research Collections');
            expect(ga[1][2].eventAction).toEqual('Click');
            expect(ga[1][2].eventLabel).toEqual('Subjects: Literature');
          });
        });
      });

      describe('Dropdown modal', function () {
        it('should track a click on Fine Arts dropdown', function () {
          element(by.css('.fine-arts .collapsible-control')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[1][2].eventCategory).toEqual('Research Collections');
            expect(ga[1][2].eventAction).toEqual('Click');
            expect(ga[1][2].eventLabel).toEqual('Dropdown - Fine Arts');
          });
        });

        it('should track a click on History dropdown', function () {
          element(by.css('.history .collapsible-control')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[1][2].eventCategory).toEqual('Research Collections');
            expect(ga[1][2].eventAction).toEqual('Click');
            expect(ga[1][2].eventLabel).toEqual('Dropdown - History');
          });
        });

        it('should track a click on Global Studies dropdown', function () {
          element(by.css('.global-studies .collapsible-control')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[1][2].eventCategory).toEqual('Research Collections');
            expect(ga[1][2].eventAction).toEqual('Click');
            expect(ga[1][2].eventLabel).toEqual('Dropdown - Global Studies');
          });
        });
      });

      // Note: The first element in ga is the Subjects main filter click,
      // the second element is clicking the dropdown button, and the third
      // element is the parent term click.
      // Must check the fourth element for the child term click.
      describe('Children Terms', function () {
        it('should track a click on Social Sciences then on Psychology', function () {
          element(by.linkText('Social Sciences')).click();
          element(by.css('.social-sciences .collapsible-control')).click();
          browser.sleep(1000);
          element(by.linkText('Psychology')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[3][2].eventCategory).toEqual('Research Collections');
            expect(ga[3][2].eventAction).toEqual('Click');
            expect(ga[3][2].eventLabel).toEqual('Subjects: Social Sciences - Psychology');
          });
        });

        it('should track a click on Performing Arts then on Theatre', function () {
          element(by.linkText('Performing Arts')).click();
          element(by.css('.performing-arts .collapsible-control')).click();
          browser.sleep(1000);
          element(by.linkText('Theatre')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[3][2].eventCategory).toEqual('Research Collections');
            expect(ga[3][2].eventAction).toEqual('Click');
            expect(ga[3][2].eventLabel).toEqual('Subjects: Performing Arts - Theatre');
          });
        });

        it('should track a click on Global Studies then on Jewish Studies', function () {
          element(by.linkText('Global Studies')).click();
          element(by.css('.global-studies .collapsible-control')).click();
          browser.sleep(1000);
          element(by.linkText('Jewish Studies')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[3][2].eventCategory).toEqual('Research Collections');
            expect(ga[3][2].eventAction).toEqual('Click');
            expect(ga[3][2].eventLabel).toEqual('Subjects: Global Studies - Jewish Studies');
          });
        });

        it('should track a click on History then on Archaeology', function () {
          element(by.linkText('History')).click();
          element(by.css('.history .collapsible-control')).click();
          browser.sleep(1000);
          element(by.linkText('Archaeology')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[3][2].eventCategory).toEqual('Research Collections');
            expect(ga[3][2].eventAction).toEqual('Click');
            expect(ga[3][2].eventLabel).toEqual('Subjects: History - Archaeology');
          });
        });

        it('should track a click on Humanities then on Philosophy', function () {
          element(by.linkText('Humanities')).click();
          element(by.css('.humanities .collapsible-control')).click();
          browser.sleep(1000);
          element(by.linkText('Philosophy')).click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[3][2].eventCategory).toEqual('Research Collections');
            expect(ga[3][2].eventAction).toEqual('Click');
            expect(ga[3][2].eventLabel).toEqual('Subjects: Humanities - Philosophy');
          });
        });
      });
    }); // End Subjects Filter

    describe('Media Filters', function () {
      beforeEach(function () {
        mediaFilter.click();
      });

      it('should track a click on Archives', function () {
        element(by.linkText('Archives')).click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[1][2].eventCategory).toEqual('Research Collections');
          expect(ga[1][2].eventAction).toEqual('Click');
          expect(ga[1][2].eventLabel).toEqual('Media: Archives');
        });
      });

      it('should track a click on Newspapers', function () {
        element(by.linkText('Newspapers')).click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[1][2].eventCategory).toEqual('Research Collections');
          expect(ga[1][2].eventAction).toEqual('Click');
          expect(ga[1][2].eventLabel).toEqual('Media: Newspapers');
        });
      });

      it('should track a click on Sound Recording', function () {
        element(by.linkText('Sound Recordings')).click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[1][2].eventCategory).toEqual('Research Collections');
          expect(ga[1][2].eventAction).toEqual('Click');
          expect(ga[1][2].eventLabel).toEqual('Media: Sound Recordings');
        });
      });
    }); // End Media Filters

    describe('Locations Filters', function () {
      beforeEach(function () {
        locationFilter.click();
      });

      it('should track a click on Schwazman Building', function () {
        element(by.linkText('Schwarzman Building')).click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[1][2].eventCategory).toEqual('Research Collections');
          expect(ga[1][2].eventAction).toEqual('Click');
          expect(ga[1][2].eventLabel).toEqual('Locations: Schwarzman Building');
        });
      });

      it('should track a click on Schomburg Center', function () {
        element(by.linkText('Schomburg Center')).click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[1][2].eventCategory).toEqual('Research Collections');
          expect(ga[1][2].eventAction).toEqual('Click');
          expect(ga[1][2].eventLabel).toEqual('Locations: Schomburg Center');
        });
      });

      it('should track a click on Library for the Performing Arts', function () {
        element(by.linkText('Library for the Performing Arts')).click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[1][2].eventCategory).toEqual('Research Collections');
          expect(ga[1][2].eventAction).toEqual('Click');
          expect(ga[1][2].eventLabel).toEqual('Locations: Library for the Performing Arts');
        });
      });

      it('should track a click on Business Center at Stavros Niarchos Foundation Library', function () {
        element(by.linkText('Business Center at Stavros Niarchos Foundation Library')).click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[1][2].eventCategory).toEqual('Research Collections');
          expect(ga[1][2].eventAction).toEqual('Click');
          expect(ga[1][2].eventLabel).toEqual('Locations: Business Center at Stavros Niarchos Foundation Library');
        });
      });
    }); // End Locations Filters

    describe('Removing Current Filters', function () {
      describe('Subject Filters', function () {
        it('should add and remove the Industry parent term', function () {
          subjectsFilter.click();
          element(by.linkText('Industry')).click();

          expect(collectionsPage.currentSubjectFilter.getText())
            .toEqual('Industry');

          collectionsPage.currentSubjectFilter.click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[2][2].eventCategory).toEqual('Research Collections');
            expect(ga[2][2].eventAction).toEqual('Click');
            expect(ga[2][2].eventLabel).toEqual('Remove Subjects: Industry');
          });
        });

        it('should add and remove the History parent term', function () {
          subjectsFilter.click();
          element(by.linkText('History')).click();

          expect(collectionsPage.currentSubjectFilter.getText())
            .toEqual('History');

          collectionsPage.currentSubjectFilter.click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[2][2].eventCategory).toEqual('Research Collections');
            expect(ga[2][2].eventAction).toEqual('Click');
            expect(ga[2][2].eventLabel).toEqual('Remove Subjects: History');
          });
        });

        it('should add and remove the Prints child term', function () {
          subjectsFilter.click();
          element(by.css('.fine-arts .collapsible-control')).click();
          element(by.linkText('Prints')).click();

          expect(collectionsPage.currentSubjectFilter.getText())
            .toEqual('Fine Arts - Prints');

          collectionsPage.currentSubjectFilter.click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[3][2].eventCategory).toEqual('Research Collections');
            expect(ga[3][2].eventAction).toEqual('Click');
            expect(ga[3][2].eventLabel).toEqual('Remove Subjects: Fine Arts - Prints');
          });
        });

        it('should add and remove the Popular Culture child term', function () {
          subjectsFilter.click();
          element(by.css('.cultural-studies .collapsible-control')).click();
          element(by.linkText('Popular Culture')).click();

          expect(collectionsPage.currentSubjectFilter.getText())
            .toEqual('Cultural Studies - Popular Culture');

          collectionsPage.currentSubjectFilter.click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[3][2].eventCategory).toEqual('Research Collections');
            expect(ga[3][2].eventAction).toEqual('Click');
            expect(ga[3][2].eventLabel).toEqual('Remove Subjects: Cultural Studies - Popular Culture');
          });
        });
      }); // End Removing Subject Filters

      describe('Media Filters', function () {
        it('should add and remove the Rare Books term', function () {
          mediaFilter.click();
          element(by.linkText('Rare Books')).click();

          expect(collectionsPage.currentMediaFilter.getText())
            .toEqual('Rare Books');

          collectionsPage.currentMediaFilter.click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[2][2].eventCategory).toEqual('Research Collections');
            expect(ga[2][2].eventAction).toEqual('Click');
            expect(ga[2][2].eventLabel).toEqual('Remove Media: Rare Books');
          });
        });

        it('should add and remove the Manuscripts term', function () {
          mediaFilter.click();
          element(by.linkText('Manuscripts')).click();

          expect(collectionsPage.currentMediaFilter.getText())
            .toEqual('Manuscripts');

          collectionsPage.currentMediaFilter.click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[2][2].eventCategory).toEqual('Research Collections');
            expect(ga[2][2].eventAction).toEqual('Click');
            expect(ga[2][2].eventLabel).toEqual('Remove Media: Manuscripts');
          });
        });
      }); // End Removing Media Filters

      describe('Locations Filters', function () {
        it('should add and remove the Schomburg Center location', function () {
          locationFilter.click();
          element(by.linkText('Schomburg Center')).click();

          expect(collectionsPage.currentLocationsFilter.getText())
            .toEqual('Schomburg Center');

          collectionsPage.currentLocationsFilter.click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[2][2].eventCategory).toEqual('Research Collections');
            expect(ga[2][2].eventAction).toEqual('Click');
            expect(ga[2][2].eventLabel).toEqual('Remove Locations: Schomburg Center');
          });
        });

        it('should add and remove the Schwarzman Building location', function () {
          locationFilter.click();
          element(by.linkText('Schwarzman Building')).click();

          expect(collectionsPage.currentLocationsFilter.getText())
            .toEqual('Schwarzman Building');

          collectionsPage.currentLocationsFilter.click();

          browser.executeScript('return window.ga_msg;').then(function (ga) {
            expect(ga[2][2].eventCategory).toEqual('Research Collections');
            expect(ga[2][2].eventAction).toEqual('Click');
            expect(ga[2][2].eventLabel).toEqual('Remove Locations: Schwarzman Building');
          });
        });
      }); // End Removing Locations Filters
    });

    describe('Divisions', function () {

      it('should track a click on a Division Name', function () {
        element(by.linkText('Dorot Jewish Division')).click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[0][2].eventCategory).toEqual('Research Collections');
          expect(ga[0][2].eventAction).toEqual('Division Title');
          expect(ga[0][2].eventLabel).toEqual('Dorot Jewish Division');
        });
      });

      it('should track a click on a Division Name', function () {
        element(by.linkText('George Arents Collection')).click();

        browser.executeScript('return window.ga_msg;').then(function (ga) {
          expect(ga[0][2].eventCategory).toEqual('Research Collections');
          expect(ga[0][2].eventAction).toEqual('Division Title');
          expect(ga[0][2].eventLabel).toEqual('George Arents Collection');
        });
      });
    }); // End Divisions GA Events

  });
});

