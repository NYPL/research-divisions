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
