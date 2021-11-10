/*eslint id-length: ["error", { "exceptions": ["i", "x", "y"] }]*/
var burndown = (function () {
  let today, issueNotesList, idealEffort, remainEffort, trendEffort,
      selectedMilestone,
      estimateStyle = "Final",
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
    // eslint-disable-next-line no-undefined
    if (filter !== undefined) {
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

  function updateTrendEffort(day1, dayDiff) {
    let xVal, yVal, sumX, sumY, sumXY, sumXX, slope, intercept, effortDay,
        valuesLength = remainEffort.length;

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
      if (slope > 0 || yVal > 0) {
        trendEffort.push([effortDay, yVal]);
      }
    }

  }

  function updateDataEstFinal() {
    let startDate, endDate, startHours, issueIID, dayDiff, idealDaily, day1, spentCummList, effort, effortDay, thisDay,
    msData = milestoneList[selectedMilestone];

    idealEffort = [];
    remainEffort = [];
    trendEffort = [];

    // ******************************* Ideal *******************************
    // ***************************** Remaining *****************************

    startDate = msData.start_date;
    endDate = msData.due_date;

    // Sum total Ideal/Remaining Hours

    startHours = 0;

    for (let issue in msData.issues) {
      if (msData.issues.hasOwnProperty(issue)) {
        issueIID = msData.issues[issue];
        // Accumlate hours
        startHours += issueListJSON[issueIID].time_stats.time_estimate / SECperHOUR;
      }
    }

    // Create Cummulative lines
    dayDiff = Math.floor((endDate - startDate) / MSperDAY);
    idealDaily = startHours / dayDiff;
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

    // ********************************* Trend *********************************
    updateTrendEffort(day1, dayDiff);

  }

  function updateDataEstChanges() {
    let startDate, endDate, startIdealHours, startRemainHours, startArray,
        estTrimedTimeList, spentTrimedTimeList,
        dayDiff, idealDaily, day1, spentCummList, estCummList,
        effort, effortDay, thisDaySpent, thisDayEst,
        msData = milestoneList[selectedMilestone];

    idealEffort = [];
    remainEffort = [];
    trendEffort = [];

    // ******************************* Ideal *******************************

    startDate = msData.start_date;
    endDate = msData.due_date;

    // Sum total Ideal Hours
    startIdealHours = issueListArr.filter(issue => msData.issues.includes(issue.iid))
                                  .reduce((acc, cur) => acc + cur.time_stats.time_estimate, 0);
    startIdealHours /= SECperHOUR;

    dayDiff = Math.floor((endDate - startDate) / MSperDAY);
    idealDaily = startIdealHours / dayDiff;

    day1 = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    idealEffort.push([day1, startIdealHours]);

    for (let i = 0; i <= dayDiff; i += 1) {
      // Determine ideal effort
      effort = Math.max(0, Math.round((startIdealHours - (idealDaily * i)) * TWOdigitROUND) / TWOdigitROUND);
      effortDay = day1 + (MSperDAY * i);
      idealEffort.push([effortDay, effort]);
    }

    idealEffort.shift();

    // ******************************* Remaining *******************************

    // Make estimateTimeList deepcopy
    estTrimedTimeList = JSON.parse(JSON.stringify(estimateTimeList));
    spentTrimedTimeList = JSON.parse(JSON.stringify(spentTimeList));

    // Make array of estimates and spends before the start date
    startArray = {};
    estTrimedTimeList.forEach(function(estimateTime) {
      // If the estimate is on the list of issues prior to the chart
      if (msData.issues.includes(estimateTime.issue) && estimateTime.date < startDate.valueOf()) {
        // Add to start array
        startArray[estimateTime.issue] = startArray[estimateTime.issue] || {date: estimateTime.date, time: 0};
        startArray[estimateTime.issue].time += estimateTime.estimateChange;

        // Remove from trimmed issueListArr
        estimateTime.estimateChange = 0;
      }
      if (msData.issues.includes(estimateTime.issue) && estimateTime.date > endDate.valueOf()) {
        endDate = new Date(estimateTime.date);
      }
    });
    spentTrimedTimeList.forEach(function(spentTime) {
      // If the estimate is on the list of issues prior to the chart
      if (msData.issues.includes(spentTime.issue) && spentTime.date < startDate.valueOf()) {
        // Add to start array
        startArray[spentTime.issue] = startArray[spentTime.issue] || {date: spentTime.date, time: 0};
        startArray[spentTime.issue].time -= spentTime.spent;

        // Remove from trimmed issueListArr
        spentTime.spent = 0;
      }
    });

    // Calculate chart line
    startRemainHours = Object.values(startArray).reduce((acc, cur) => acc + cur.time, 0);
    remainEffort.push([day1, startRemainHours]);

    spentCummList = jsonToChartSeries(spentTrimedTimeList, "date", "spent", ["issue", selectedMilestone]);
    estCummList = jsonToChartSeries(estTrimedTimeList, "date", "estimateChange", ["issue", selectedMilestone]);

    dayDiff = Math.floor((endDate - startDate) / MSperDAY);
    for (let i = 0; i <= dayDiff; i += 1) {
      effortDay = day1 + (MSperDAY * i);

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

    remainEffort.shift();

    // ********************************* Trend *********************************
    updateTrendEffort(day1, dayDiff);
  }

  function updateData() {
    switch (estimateStyle) {
      case "Final":
        updateDataEstFinal(selectedMilestone);
        break;
      case "Changes":
        updateDataEstChanges(selectedMilestone);
        break;
      default:
    }
  }

  function parseNotes() {
    let noteableIID, addSubREimplicit, addSubREexplicit, matchAddSub,
        tempSpentTimeList, spent, estimateRE, matchEst, tempEstTimeList,
        estimate, date, timeParts, timePart, dupDate;
    // let matchAddSub;

    // Go through notes to get changes in spend & estimates
    noteableIID = "Empty Note";

    addSubREimplicit = /(added|subtracted) (.*) of time spent/;
    addSubREexplicit = /(added|subtracted) (.*) of time spent at (.*)-(.*)-(.*)/;
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

      matchAddSub = note.body.match(addSubREimplicit);

      // If time spent was added or subtracted
      spent = 0;
      if (matchAddSub !== null) {
        // Determine date
        if (note.body.match(addSubREexplicit) !== null) {
          matchAddSub = note.body.match(addSubREexplicit);

          matchAddSub[3] = parseInt(matchAddSub[3], 10);
          matchAddSub[4] = parseInt(matchAddSub[4], 10);
          matchAddSub[5] = parseInt(matchAddSub[5], 10);
        } else {
          date = new Date(note.created_at);

          matchAddSub[3] = date.getFullYear();
          matchAddSub[4] = date.getMonth() + 1;
          matchAddSub[5] = date.getDate();
        }

        date = Date.UTC(parseInt(matchAddSub[3], 10),
                        parseInt(matchAddSub[4], 10) - 1,
                        parseInt(matchAddSub[5], 10));

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

    tempSpentTimeList = spentTimeList.reduce((acc, cur) => {
      acc[cur.issue + "-" + cur.date] = acc[cur.issue + "-" + cur.date] || {date: cur.date, issue: cur.issue, spent: 0};
      acc[cur.issue + "-" + cur.date].spent += +cur.spent;

      return acc;
    }, {});

    for (let issue in tempSpentTimeList) {
      if (tempSpentTimeList.hasOwnProperty(issue)) {
        // **************************** CHECK DATE ****************************
        // if (tempSpentTimeList[issue].spent > 0 && new Date(tempSpentTimeList[issue].date) < currProjStartDate) {
        //   noteableIID = tempSpentTimeList[issue].issue;
        //   issues.addIssueError(issueListJSON[noteableIID], "Spend prior to project's creation date");
        // }
      }
    }

    // *************************** END OF NOTE LOOP ***************************

    // Spent Sanity check
    issueListArr.forEach(function(issue) {
      let loggedSpent, gitlabSpent;

      loggedSpent = spentTimeList.filter(row => row.issue === issue.iid).reduce((acc, cur) => acc + cur.spent, 0);
      gitlabSpent = issue.time_stats.total_time_spent / SECperHOUR;

      loggedSpent = Math.round(loggedSpent * TWOdigitROUND) / TWOdigitROUND;
      gitlabSpent = Math.round(gitlabSpent * TWOdigitROUND) / TWOdigitROUND;

      if (loggedSpent !== gitlabSpent) {
        date = new Date(issue.created_at);
        date = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

        spentTimeList.push({date: date, spent: gitlabSpent - loggedSpent, issue: issue.iid, author: issue.author.name});
      }
    });

    // Estimate Sanity check
    issueListArr.forEach(function(issue) {
      let loggedEst, gitlabEst;

      loggedEst = estimateTimeList.filter(row => row.issue === issue.iid).reduce((acc, cur) => acc + cur.estimateChange, 0);
      gitlabEst = issue.time_stats.time_estimate / SECperHOUR;

      if (loggedEst !== gitlabEst) {
        date = new Date(issue.created_at);
        date = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

        estimateTimeList.push({date: date, estimateChange: gitlabEst, issue: issue.iid, author: issue.author.name});
      }
    });
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
    if (rootPage !== "report.html") {
      $("#milestone-dropdown").selectize()[0].selectize.destroy();
      $("#milestone-dropdown").selectize({
        valueField: "iid",
        labelField: "dropdownText",
        searchField: "dropdownText",
        options: Object.values(milestoneList),
        disabledField: "disabled",
        create: false
      });
      $("#milestone-dropdown").selectize()[0].selectize.setValue(selectedMilestone, false);
    }

  }

  function setMilestoneData() {
    let startDate, endDate, issueStartDate, issueEndDate;

    // Find extreme start and end dates
    if (issueListArr.length === 0) {
      startDate = today;
      endDate = today;
    } else {
      startDate = issueListArr[0].created_at;
      endDate = issueListArr[0].updated_at;

      // Determine milestone start and end dates
      startDate = new Date(startDate);
      startDate = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
      endDate = new Date(endDate);
      endDate = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
    }

    // Search issues for extreme dates
    for (let issue in issueListArr) {
      if (issueListArr.hasOwnProperty(issue)) {
        issueStartDate = new Date(issueListArr[issue].created_at);
        issueStartDate = new Date(Date.UTC(issueStartDate.getFullYear(), issueStartDate.getMonth(), issueStartDate.getDate()));

        issueEndDate = new Date(issueListArr[issue].updated_at);
        issueEndDate = new Date(Date.UTC(issueEndDate.getFullYear(), issueEndDate.getMonth(), issueEndDate.getDate()));

        if (startDate > issueStartDate) {startDate = issueStartDate;}
        if (endDate < issueEndDate) {endDate = issueEndDate;}
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
    issues.loadErrorTable();
  }

  async function updateBurndown() {
    let title, footnote;

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

    updateData(selectedMilestone);

    if (selectedMilestone === "All") {
      title = "Project";
      document.getElementById("milestone-link").classList.add("d-none");
    } else if (selectedMilestone === "None") {
      title = "";
      document.getElementById("milestone-link").classList.add("d-none");
    } else {
      title = "Sprint";
      document.getElementById("milestone-link").href = currProjecURL + "/-/milestones/" + selectedMilestone;
      document.getElementById("milestone-link").classList.remove("d-none");
    }

    if (estimateStyle === "Final") {
      footnote = "Using final estimates only";
    } else { //"Changes"
      footnote = "Showing changes in estimates";
    }

    $(function () {
      $("#burndown-chart").highcharts({
        title: {text: title + " Burndown Chart"},
        subtitle: {text: currProjectName + " - " + milestoneList[selectedMilestone].title},
        chart: {
          events: {
            load: function () {
              var label = this.renderer.label(footnote)
              .css({
                fontSize: "11px",
                color: "#555555"
              })
              .add();

              label.align(Highcharts.extend(label.getBBox(), {
                align: "right",
                verticalAlign: "bottom",
                x: 3,
                y: 0
              }), null, "spacingBox");
            }
          },
          marginBottom: 120
        },
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
          zIndex: 3,
          name: "Ideal Burndown",
          color: "rgba(255,0,0,0.75)",
          marker: {
            enabled: false
          },
          lineWidth: 2,
          data: idealEffort
        }, {
          type: "spline",
          zIndex: 4,
          name: "Remaining Effort",
          color: "rgba(0, 100, 0, 0.75)",
          marker: {
            radius: 6
          },
          lineWidth: 2,
          data: remainEffort
        }, {
          zIndex: 2,
          name: "Actual Effort Trend",
          color: "rgba(40, 40, 40, 0.25)",
          marker: {
            enabled: false
          },
          lineWidth: 1,
          data: trendEffort,
          enableMouseTracking: false
        }, {
          type: "column",
          zIndex: 1,
          name: "Completed Hours",
          color: "#4682b4",
          data: jsonToChartSeries(spentTimeList, "date", "spent", ["issue", selectedMilestone])
        }],
        exporting: {
          sourceWidth: 800,
          sourceHeight: 400
        },
        credits: {
          text: "Highcharts.com and lilyheart.github.io/agile-gitlabce",
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
    updateBurndown: async function(newMilestone) {
      if (newMilestone === "Auto" && !selectedMilestone) {
        selectedMilestone = "All";
      } else if (newMilestone === "Auto") {
        // No changes to selectedMilestone
      } else {
        selectedMilestone = newMilestone;
      }
      today = new Date();
      today = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      await updateBurndown();

      return;
    },
    setBurndownUnloaded: function() {
      isLoaded = false;
    },
    setEstimateStyle: function(newstyle) {
      estimateStyle = newstyle;
      updateBurndown();
    }
  };

})();
