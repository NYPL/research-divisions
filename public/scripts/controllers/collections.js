/*jslint indent: 2, maxlen: 80, nomen: true */
/*globals nypl_locations, _, angular, jQuery,
console, $location, $ */

(function () {

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
