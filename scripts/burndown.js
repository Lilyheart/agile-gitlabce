/*eslint id-length: ["error", { "exceptions": ["i", "x", "y"] }]*/
var burndown = (function () {
  let today, issueNotesList, idealEffort, remainEffort, trendEffort,
      isLoaded = false;
  const INVERSE = -1,
        // eslint-disable-next-line id-length, no-magic-numbers
        CONVERTTABLE = {mo: 160, w: 40, d: 8, h: 1, m: (1.0 / 60.0)},
        SECperHOUR = 3600,
        // eslint-disable-next-line no-magic-numbers
        MSperDAY = (1000 * 60 * 60 * 24),
        TWOdigitROUND = 100;

  function jsonToChartSeries(source, xlabel, ylabel, filter) {
    let filteredJSON, chartSeries;

    // for each note, determine if it's from an issue of interest
    if (filter !== null) {
      filteredJSON = source.filter(row => milestoneList[filter[1]].issues.includes(row.issue));
    } else {
      filteredJSON = source;
    }

    // Combine x values by summing y values
    chartSeries = filteredJSON.reduce((acc, cur) => {
      acc[cur[xlabel]] = acc[cur[xlabel]] || {x: cur[xlabel], y: 0};
      acc[cur[xlabel]].y += +cur[ylabel];

      return acc;
    }, {});

    // Reduce json to array, sort array by x axis, and drop Zero Sums
    chartSeries = Object.values(chartSeries);
    chartSeries = chartSeries.sort(function(first, second) {return parseFloat(first.x) - parseFloat(second.x);});
    chartSeries = chartSeries.filter(row => row.y !== 0);

    return chartSeries;
  }

  function updateDataSimple(selectedMilestone) {
    let startDate, endDate, startHours, issueIID, dayDiff, idealDaily, day1, spentCummList, effort, effortDay, thisDay, trendSlope;

    startDate = milestoneList[selectedMilestone].start_date;
    endDate = milestoneList[selectedMilestone].due_date;

    startHours = 0;

    for (let issue in milestoneList[selectedMilestone].issues) {
      if (milestoneList[selectedMilestone].issues.hasOwnProperty(issue)) {
        issueIID = milestoneList[selectedMilestone].issues[issue];
        // Accumlate hours
        startHours += issueListJSON[issueIID].time_stats.time_estimate / SECperHOUR;
      }
    }

    // Create Cummulative lines
    dayDiff = Math.floor((endDate - startDate) / MSperDAY);
    idealDaily = startHours / dayDiff;

    idealEffort = [];
    remainEffort = [];
    trendEffort = [];
    day1 = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    idealEffort.push([day1, startHours]);
    remainEffort.push([day1, startHours]);

    spentCummList = jsonToChartSeries(spentTimeList, "date", "spent", ["issue", selectedMilestone]);

    for (let i = 0; i <= dayDiff; i += 1) {
      // Determine ideal effort
      effort = Math.max(0, Math.round((startHours - (idealDaily * i)) * TWOdigitROUND) / TWOdigitROUND);
      effortDay = day1 + (MSperDAY * i);
      idealEffort.push([effortDay, effort]);

      // Determine remaining effort
      if (effortDay <= today) {
        thisDay = spentCummList.filter(item => item.x === effortDay);
        if (thisDay.length === 0) {
          effort = remainEffort[i][1];
        } else {
          effort = remainEffort[i][1] - thisDay[0].y;
        }
        remainEffort.push([effortDay, effort]);
      }
    }

    idealEffort.shift();
    remainEffort.shift();

    // Determine trend effort
    /* eslint-disable */
    let xVal, yVal, sumX, sumY, sumXY, sumXX, slope, intercept,
        valuesLength = remainEffort.length;
    /* eslint-enable */

    sumX = sumY = sumXY = sumXX = 0;

    for (let i = 0; i < valuesLength; i += 1) {
      xVal = i + 1;
      yVal = remainEffort[i][1];
      sumX += xVal;
      sumY += yVal;
      sumXY += xVal * yVal;
      sumXX += xVal * xVal;
    }

    slope = (valuesLength * sumXY - sumX * sumY) / (valuesLength * sumXX - sumX * sumX);
    intercept = (sumY / valuesLength) - (slope * sumX) / valuesLength;

    for (let i = 0; i <= dayDiff; i += 1) {
      effortDay = day1 + (MSperDAY * (i));
      yVal = slope * (i + 1) + intercept;
      trendEffort.push([effortDay, Math.max(0, yVal)]);
    }
  }

  function updateDataEstim(selectedMilestone) {
    let startDate, endDate, startIdealHours, issueIID, estStartArray,
        startRemainHours, estTrimedTimeList,
        dayDiff, idealDaily, day1, spentCummList, estCummList,
        effort, effortDay, thisDaySpent, thisDayEst;
    // let , trendSlope;

    startDate = milestoneList[selectedMilestone].start_date;
    endDate = milestoneList[selectedMilestone].due_date;

    // Sum total Ideal Hours
    startIdealHours = 0;
    for (let issue in milestoneList[selectedMilestone].issues) {
      if (milestoneList[selectedMilestone].issues.hasOwnProperty(issue)) {
        issueIID = milestoneList[selectedMilestone].issues[issue];
        // Accumlate hours
        startIdealHours += issueListJSON[issueIID].time_stats.time_estimate / SECperHOUR;
      }
    }

    // Make array of start estimates
    estStartArray = {};
    for (let estimateIndex in estimateTimeList) {
      if (estimateTimeList.hasOwnProperty(estimateIndex)) { // for each estimateTimeList
        if (milestoneList[selectedMilestone].issues.includes(estimateTimeList[estimateIndex].issue)) {
          if (estStartArray.hasOwnProperty(estimateTimeList[estimateIndex].issue)) {
            if (estimateTimeList[estimateIndex].date < estStartArray[estimateTimeList[estimateIndex].issue].date) {
              let estItem = {date: estimateTimeList[estimateIndex].date, estimateChange: estimateTimeList[estimateIndex].estimateChange};

              estStartArray[estimateTimeList[estimateIndex].issue] = estItem;
            }
          } else {
            let estItem = {date: estimateTimeList[estimateIndex].date, estimateChange: estimateTimeList[estimateIndex].estimateChange};

            estStartArray[estimateTimeList[estimateIndex].issue] = estItem;
          }
        }
      }
    }

    // Sum total Ideal Hours
    startRemainHours = 0;
    for (let estIndex in estStartArray) {
      if (estStartArray.hasOwnProperty(estIndex)) {
        startRemainHours += estStartArray[estIndex].estimateChange;
      }
    }

    // Make estimateTimeList deepcopy and remove start times
    estTrimedTimeList = JSON.parse(JSON.stringify(estimateTimeList));
    for (let estIndex in estTrimedTimeList) {
      if (estTrimedTimeList.hasOwnProperty(estIndex)) {
        let issueid = estTrimedTimeList[estIndex].issue;

        // TODO Find better way to word
        if (estStartArray.hasOwnProperty(issueid) && estStartArray[issueid].hasOwnProperty("date")) {
          if ((estTrimedTimeList[estIndex].date === estStartArray[issueid].date)) {
            estTrimedTimeList[estIndex].estimateChange = 0;
          }
        }
      }
    }

    // Create Cummulative lines
    dayDiff = Math.floor((endDate - startDate) / MSperDAY);
    idealDaily = startIdealHours / dayDiff;

    idealEffort = [];
    remainEffort = [];
    trendEffort = [];
    day1 = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    idealEffort.push([day1, startIdealHours]);
    remainEffort.push([day1, startRemainHours]);

    spentCummList = jsonToChartSeries(spentTimeList, "date", "spent", ["issue", selectedMilestone]);
    estCummList = jsonToChartSeries(estTrimedTimeList, "date", "estimateChange", ["issue", selectedMilestone]);

    for (let i = 0; i <= dayDiff; i += 1) {
      // Determine ideal effort
      effort = Math.max(0, Math.round((startIdealHours - (idealDaily * i)) * TWOdigitROUND) / TWOdigitROUND);
      effortDay = day1 + (MSperDAY * i);
      idealEffort.push([effortDay, effort]);

      // Determine remaining effort
      if (effortDay <= today) {
        effort = remainEffort[i][1];
        // subtract spent hours
        thisDaySpent = spentCummList.filter(item => item.x === effortDay);
        if (thisDaySpent.length !== 0) {
          effort -= thisDaySpent[0].y;
        }
        // add changes in estimate
        thisDayEst = estCummList.filter(item => item.x === effortDay);
        if (thisDayEst.length !== 0) {
          effort += thisDayEst[0].y;
        }

        remainEffort.push([effortDay, effort]);
      }
    }

    idealEffort.shift();
    remainEffort.shift();

    // Determine trend effort
    /* eslint-disable */
    let xVal, yVal, sumX, sumY, sumXY, sumXX, slope, intercept,
        valuesLength = remainEffort.length;
    /* eslint-enable */

    sumX = sumY = sumXY = sumXX = 0;

    for (let i = 0; i < valuesLength; i += 1) {
      xVal = i + 1;
      yVal = remainEffort[i][1];
      sumX += xVal;
      sumY += yVal;
      sumXY += xVal * yVal;
      sumXX += xVal * xVal;
    }

    slope = (valuesLength * sumXY - sumX * sumY) / (valuesLength * sumXX - sumX * sumX);
    intercept = (sumY / valuesLength) - (slope * sumX) / valuesLength;

    for (let i = 0; i <= dayDiff; i += 1) {
      effortDay = day1 + (MSperDAY * (i));
      yVal = slope * (i + 1) + intercept;
      trendEffort.push([effortDay, Math.max(0, yVal)]);
    }
  }

  function parseNotes() {
    let noteableIID, addSubRE, matchAddSub, tempSpentTimeList, spent,
        estimateRE, matchEst, tempEstTimeList, estimate,
        date, timeParts, timePart, dupDate;
    // let matchAddSub;

    // Go through notes to get changes in spend & estimates
    noteableIID = "Empty Note";

    addSubRE = /(added|subtracted) (.*) of time spent at (.*)-(.*)-(.*)/;
    spentTimeList = [];
    tempSpentTimeList = [];

    estimateRE = /(changed time estimate) to (.*)/;
    estimateTimeList = [];
    tempEstTimeList = [];

    issueNotesList.forEach(function(note) {
      if (noteableIID !== note.noteable_iid) {
        // parsing new issue - add spent time from last issue and reset accumulator
        spentTimeList = spentTimeList.concat(tempSpentTimeList);
        estimateTimeList = estimateTimeList.concat(tempEstTimeList);
        tempSpentTimeList = [];
        tempEstTimeList = [];
        noteableIID = note.noteable_iid;
      }

      // ******************************* SPENDS *******************************

      matchAddSub = note.body.match(addSubRE);

      // If time spent was added or subtracted
      spent = 0;
      if (matchAddSub !== null) {
        date = Date.UTC(parseInt(matchAddSub[3], 10), parseInt(matchAddSub[4], 10) - 1, parseInt(matchAddSub[5], 10));
        timeParts = matchAddSub[2].split(" ");
        for (let timesIndex in timeParts) {
          if (timeParts.hasOwnProperty(timesIndex)) {
            timePart = timeParts[timesIndex].match(/([0-9]*)([a-zA-Z]*)/);
            if (matchAddSub[1] === "subtracted") {timePart[1] *= INVERSE;}
            spent += (timePart[1] * CONVERTTABLE[timePart[2]]);
          }
        }
        tempSpentTimeList.push({date: date, spent: spent, issue: noteableIID, author: note.author.name});
      }

      // If time spent was removed
      if (note.body === "removed time spent") {
        tempSpentTimeList = [];
      }

      // ******************************* ESTIMATES *******************************

      matchEst = note.body.match(estimateRE);
      // if estimate is changed
      estimate = 0;
      date = new Date(note.created_at);
      date = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
      if (matchEst !== null) {
        // get estimate change total for one line (e.g. 1d 4h = 12h)
        timeParts = matchEst[2].split(" ");
        for (let timesIndex in timeParts) {
          if (timeParts.hasOwnProperty(timesIndex)) {
            // parse time
            timePart = timeParts[timesIndex].match(/([0-9]*)([a-zA-Z]*)/);
            estimate += (timePart[1] * CONVERTTABLE[timePart[2]]);
          }
        }
        // subtract previous estimates from current line
        if (tempEstTimeList.length > 0) {
          estimate -= tempEstTimeList.reduce((acc, cur) => acc + cur.estimateChange, 0);
        }
        // TODO redo from here
        dupDate = false;
        // check to see if date already in dictArray
        for (let tempIndex in tempEstTimeList) {
          if (tempEstTimeList.hasOwnProperty(tempIndex)) {
            if (tempEstTimeList[tempIndex].date === date) {
              tempEstTimeList[tempIndex].estimateChange += estimate;
              dupDate = true;
            }
          }
        }
        if (!dupDate) {
          tempEstTimeList.push({date: date, estimateChange: estimate, issue: noteableIID, author: note.author.name});
        }
        // TODO to here
      }

      // if estimate is removed
      if (note.body === "removed time estimate") {
        estimate = tempEstTimeList.reduce((acc, cur) => acc + cur.estimateChange, 0) * INVERSE;
        tempEstTimeList.push({date: date, estimateChange: estimate, issue: noteableIID, author: note.author.name});
      }
    });

    // concat data from last issue
    spentTimeList = spentTimeList.concat(tempSpentTimeList);
    estimateTimeList = estimateTimeList.concat(tempEstTimeList);
  }

  function createMilestoneDD() {
    let dropdownText;

    // Add fields
    for (let key in milestoneList) {
      if (milestoneList.hasOwnProperty(key)) {
        dropdownText = milestoneList[key].title;
        dropdownText += " (" + milestoneList[key].issues.length + " issues)";
        milestoneList[key].dropdownText = dropdownText;
        milestoneList[key].disabled = (milestoneList[key].issues.length === 0);
      }
    }

    // Add selectize
    $("#milestone-dropdown").selectize()[0].selectize.destroy();
    $("#milestone-dropdown").selectize({
      valueField: "iid",
      labelField: "dropdownText",
      searchField: "dropdownText",
      options: Object.values(milestoneList),
      disabledField: "disabled",
      create: false
    });
    $("#milestone-dropdown").selectize()[0].selectize.setValue("All", false);

  }

  function setMilestoneData() {
    let startDate, endDate;

    // Find extreme start and end dates
    if (issueListArr.length === 0) {
      startDate = today;
      endDate = today;
    } else {
      startDate = issueListArr[0].created_at;
        endDate = issueListArr[0].updated_at;
    }

    // Determine milestone start and end dates
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    // Search issues for extreme dates
    for (let issue in issueListArr) {
      if (issueListArr.hasOwnProperty(issue)) {
        if (startDate > issueListArr[issue].created_at) {startDate = issueListArr[issue].created_at;}
        if (endDate < issueListArr[issue].updated_at) {endDate = issueListArr[issue].updated_at;}
      }
    }

    // Search milestones for extreme dates
    for (let milestone in milestoneList) {
      if (milestoneList.hasOwnProperty(milestone)) {
        if (startDate > milestoneList[milestone].start_date) {startDate = milestoneList[milestone].start_date;}
        if (endDate < milestoneList[milestone].due_date) {endDate = milestoneList[milestone].due_date;}
      }
    }

    // eslint-disable-next-line camelcase
    milestoneList["None"].start_date = startDate;
    // eslint-disable-next-line camelcase
    milestoneList["All"].start_date = startDate;
    // eslint-disable-next-line camelcase
    milestoneList["None"].due_date = endDate;
    // eslint-disable-next-line camelcase
    milestoneList["All"].due_date = endDate;

    createMilestoneDD();
  }

  async function getIssuesData() {
    let issueIID, url, newprogress;

    issueNotesList = [];
    // Get data from issues
    for (let issue in issueListArr) {
      if (issueListArr.hasOwnProperty(issue)) {
        // Add issue id to appropriate milestones dictionary
        milestoneList["All"].issues.push(issueListArr[issue].iid);
        if (issueListArr[issue].milestone.iid) {
          milestoneList[issueListArr[issue].milestone.iid].issues.push(issueListArr[issue].iid);
        } else {
          milestoneList["None"].issues.push(issueListArr[issue].iid);
        }

        // Get Notes
        issueIID = issueListArr[issue].iid;
        url = baseURL + "projects/" + projectID + "/issues/" + issueIID + "/notes";

        if (gitlabKey.length > 0) {
          url += "?sort=asc&order_by=updated_at&&per_page=100&" + gitlabKey;
        }

        for (let i = 1; i <= getHeaderValue(url, "x-total-pages"); i += 1) {
          await $.getJSON(url + "&page=" + i, function(data) {
            issueNotesList = issueNotesList.concat(data);
          });
        }

        // Update progress bar on burndown tab
        newprogress = ((parseInt(issue, 10) + 1) * PERCENT) / issueListArr.length;
        $("#burndown_progress").attr("aria-valuenow", newprogress).css("width", newprogress + "%");
        newprogress = Math.round(newprogress);
        $("#burndown_progress")[0].innerHTML = newprogress + "%";
      }
    }
  }

  async function getNewData() {
    let dates;

    await getIssuesData();
    await setMilestoneData();
    await parseNotes();
  }

  async function updateBurndownData(selectedMilestone) {
    let title;

    await checkForUpdates();

    if (!isLoaded) {
      if (gitlabKey === "") {
        setPhase("burndown_start");
        setPhase("burndown_end");
        document.getElementById("burndown-unavailable").style.display = "block";
        document.getElementById("milestone-selection").style.display = "none";

        return;
      }
      setPhase("burndown_start");
      await getNewData();
      isLoaded = true;
    }

    updateDataEstim(selectedMilestone);

    if (selectedMilestone === "All") {
      title = "Project";
    } else if (selectedMilestone === "None") {
      title = "";
    } else {
      title = "Sprint";
    }

    $(function () {
      $("#burndown-chart").highcharts({
        title: {text: title + " Burndown Chart"},
        subtitle: {text: currProjectName + " - " + milestoneList[selectedMilestone].title},
        xAxis: {
          type: "datetime",
          title: {text: "Date"},
          labels: {
            format: "{value:%m/%d/%Y}",
            rotation: -30
          },
          plotLines: [{
            color: "#888888",
            width: 2,
            value: today,
            dashStyle: "longdashdot"
          }]
        },
        annotations: [{
          color: "rgba(40, 40, 40, 0.25)",
          labels: [{
            point: {
              x: today,
              y: 0,
              xAxis: 0
            },
            text: "Today"
          }]
        }],
        yAxis: {
          title: {text: "Hours"}
        },
        tooltip: {
          valueSuffix: " hrs",
          valueDecimals: 2
        },
        legend: {
          layout: "vertical",
          align: "right",
          verticalAlign: "middle",
          borderWidth: 1,
          padding: 15
        },
        series: [{
          type: "column",
          name: "Completed Hours",
          color: "#4682b4",
          data: jsonToChartSeries(spentTimeList, "date", "spent", ["issue", selectedMilestone])
        }, {
          name: "Ideal Burndown",
          color: "rgba(255,0,0,0.75)",
          marker: {
            enabled: false
          },
          lineWidth: 2,
          data: idealEffort
        }, {
          type: "spline",
          name: "Remaining Effort",
          color: "rgba(0, 100, 0, 0.75)",
          marker: {
            radius: 6
          },
          lineWidth: 2,
          data: remainEffort
        }, {
          name: "Actual Effort Trend",
          color: "rgba(40, 40, 40, 0.25)",
          marker: {
            enabled: false
          },
          lineWidth: 1,
          data: trendEffort,
          enableMouseTracking: false
        }],
        exporting: {
          sourceWidth: 800,
          sourceHeight: 400
        },
        credits: {
          text: "Highcarts.com and lilyheart.github.io/agile-gitlabce",
          href: "https://lilyheart.github.io/agile-gitlabce/"
        },
        responsive: {
          rules: [{
            condition: {
              maxWidth: 500
            },
            chartOptions: {
              legend: {
                align: "center",
                verticalAlign: "bottom",
                layout: "vertical"
              }
            }
          }]
        }
      });
    });

    hours.updateHoursData(selectedMilestone);

    setPhase("burndown_end");
  }

  return {
    updateBurndownData: async function(selectedMilestone) {
      today = new Date(new Date().setHours(0, 0, 0, 0)).getTime() - (new Date()).getTimezoneOffset() * MSperMIN;
      await updateBurndownData(selectedMilestone);

      return;
    },
    setBurndownUnloaded: function() {
      isLoaded = false;
    }
  };

})();
