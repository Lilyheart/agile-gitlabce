var burndown = (function () {

  let startHours, startDate, endDate, today, idealEffort, remainEffort, trendEffort, issueNotesList, isLoaded;
  /* eslint-disable */
  const CONVERTTABLE = {
    mo: 160,
    w : 40,
    d : 8,
    h : 1,
    m : 1.0 / 60.0
  }
  const MSperDAY = (1000 * 60 * 60 * 24);
  const SECperHOUR = 3600
  const INVERSE = -1;
  const TWOdigitROUND = 100;
  const MSperMIN = (1000 * 60);
  const TRENDOFFSET = 2;
  /* eslint-enable */

  isLoaded = false;

  async function getIssueNotes(url) {
    let projectPages;

    // Get number of project pages
    projectPages = getHeaderValue(url, "x-total-pages");

    // Get Data
    // console.log("Obtaining data at: " + url + "&page=1 of " + projectPages + " page(s)");
    for (let i = 1; i <= projectPages; i += 1) {
      await $.getJSON(url + "&page=" + i, function(data) {
        issueNotesList = issueNotesList.concat(data);
      });
    }
  }

  function jsonToSeries(json, xlabel, ylabel, filter) {
    let filteredJSON, series, desiredIssues;

    // filter
    if (filter !== null) {
      // for each note, determine if it's from an issue of interest
      filteredJSON = json.filter(note => milestoneList[filter[1]].issues.includes(note.issue));
    }

    // Reduce json
    series = Object.values(filteredJSON.reduce((acc, cur) => {
        /* eslint-disable */
      acc[cur[xlabel]] = acc[cur[xlabel]] || {x: cur[xlabel], y : 0};
      acc[cur[xlabel]].y += +cur[ylabel];
        /* eslint-enable */

      return acc;
    }, {}));

    // Sort by x axis
    series = series.sort(function(first, second) {
      return parseFloat(first.x) - parseFloat(second.x);
    });

    // Drop Zero Sums by going through array (backwards to avoid skipped indices)
    for (let i = series.length - 1; i >= 0; i -= 1) {
      if (series[i].y === 0) {
        series.splice(i, 1);
      }
    }

    return series;
  }

  function createMilestoneDD() {
    let milestoneArr, dropdown, dropdownText;

    milestoneArr = [];
    for (let milestone in milestoneList) {
      if (milestoneList.hasOwnProperty(milestone)) {
        dropdownText = milestoneList[milestone].title;
        dropdownText += " (" + milestoneList[milestone].issues.length + " issues)";

        milestoneArr.push(milestoneList[milestone]);
      }
    }

    milestoneArr.sort(function (first, second) {
      if (first.due_date > second.due_date) {
        return 1;
      } else if (first.due_date < second.due_date) {
        return INVERSE;
      } else {
        return 0;
      }
    });

    // Set up drowndown
    dropdown = $("#milestone-dropdown");
    dropdown.empty();

    // Fill dropdown
    for (let milestone in milestoneArr) { // iid
      if (milestoneArr.hasOwnProperty(milestone)) {
        dropdownText = milestoneArr[milestone].title;
        dropdownText += " (" + milestoneArr[milestone].issues.length + " issues)";
        if (milestoneArr[milestone].issues.length > 0) {
          dropdown.append($("<option></option>").attr("value", milestoneArr[milestone].iid).text(dropdownText));
        } else {
          dropdown.append($("<option disabled></option>").attr("value", milestoneArr[milestone].iid).text(dropdownText));
        }
      }
    }

    document.getElementById("milestone-dropdown").value = "All";

  }

  async function getNewData() {
    let issueIID, url, addSubRE, tempSpentTimeList, body, match, noteableIID, time, spent, date, newprogress;

    issueNotesList = [];
    if (issueListArr.length === 0) {
      startDate = today;
      endDate = today;
    } else {
      startDate = issueListArr[0].created_at;
      endDate = issueListArr[0].updated_at;
    }

    // Get data from issues
    for (let issue in issueListArr) {
      if (issueListArr.hasOwnProperty(issue)) {
        // Update dates
        if (startDate > issueListArr[issue].created_at) {startDate = issueListArr[issue].created_at;}
        if (endDate < issueListArr[issue].updated_at) {endDate = issueListArr[issue].updated_at;}

        // Get Notes
        issueIID = issueListArr[issue].iid;
        url = baseURL + "projects/" + projectID + "/issues/" + issueIID + "/notes";

        if (gitlabKey.length > 0) {
          url += "?sort=asc&order_by=updated_at&&per_page=100&" + gitlabKey;
        }

        milestoneList["All"].issues.push(issueListArr[issue].iid);
        if (issueListArr[issue].milestone.iid) {
          milestoneList[issueListArr[issue].milestone.iid].issues.push(issueListArr[issue].iid);
        } else {
          milestoneList["None"].issues.push(issueListArr[issue].iid);
        }

        await getIssueNotes(url);

        newprogress = ((parseInt(issue, 10) + 1) * PERCENT) / issueListArr.length;
        $("#burndown_progress").attr("aria-valuenow", newprogress).css("width", newprogress + "%");
        newprogress = Math.round(newprogress);
        $("#burndown_progress")[0].innerHTML = newprogress + "%";
      }
    }

    startDate = new Date(startDate);
    endDate = new Date(endDate);

    for (let milestone in milestoneList) {
      if (milestoneList.hasOwnProperty(milestone)) {
        if (startDate > milestoneList[milestone].start_date) {startDate = milestoneList[milestone].start_date;}
        if (endDate < milestoneList[milestone].due_date) {endDate = milestoneList[milestone].due_date;}
      }
    }

    /* eslint-disable */
    milestoneList["None"].start_date = startDate;
    milestoneList["All"].start_date = startDate;
    milestoneList["None"].due_date = endDate;
    milestoneList["All"].due_date = endDate;
    /* eslint-enable */

    createMilestoneDD();

    // Go through notes to get changes in spend
    noteableIID = "Empty Note";
    addSubRE = /(added|subtracted) (.*) of time spent at (.*)-(.*)-(.*)/;
    spentTimeList = [];
    tempSpentTimeList = [];

    issueNotesList.forEach(function(note) {
      if (noteableIID !== note.noteable_iid) {
        // new issue - add spent time from last issue and reset accumulator
        spentTimeList = spentTimeList.concat(tempSpentTimeList);
        tempSpentTimeList = [];
        noteableIID = note.noteable_iid;
      }

      // Check for changes in time spent
      body = note.body;
      match = body.match(addSubRE);

      // If has added or subtracted
      if (match !== null) {
        // parse spent
        time = match[2].match(/([0-9]*)([a-zA-Z]*)/);
        spent = time[1] * CONVERTTABLE[time[2]];
        // update if subtracted
        if (match[1] === "subtracted") {spent *= INVERSE;}
        // parse date
        date = Date.UTC(parseInt(match[3], 10), parseInt(match[4], 10) - 1, parseInt(match[5], 10));
        tempSpentTimeList.push({date: date, spent: spent, issue: noteableIID, author: note.author.name});
      }

      // If time spent was removed
      if (body === "removed time spent") {
        tempSpentTimeList = [];
      }
    });
    spentTimeList = spentTimeList.concat(tempSpentTimeList);
  }

  function updateData(selectedMilestone) {
    let issueIID, dayDiff, idealDaily, day1, spentCummList, effort, effortDay, thisDay, trendSlope;

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

    spentCummList = jsonToSeries(spentTimeList, "date", "spent", ["issue", selectedMilestone]);

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
      trendEffort.push([effortDay, yVal]);
    }
  }

  async function updateBurndownData(selectedMilestone) {
    await checkForUpdates()

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

    $(function () {
      $("#burndown-chart").highcharts({
        title: {text: "Project Burndown Chart"},
        subtitle: {text: currProjectName + " - " + milestoneList[selectedMilestone].title},
        xAxis: {
          type: "datetime",
          title: {text: "Date"},
          // tickInterval: 86400000,
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
              /* eslint-disable */
              x: today,
              y: 0,
              xAxis: 0
              /* eslint-enable */
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
          name: "Completed Tasks",
          color: "#4682b4",
          data: jsonToSeries(spentTimeList, "date", "spent", ["issue", selectedMilestone])
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

    // if (!time1) {
    //   time1 = performance.now();
    //   console.log("Took " + (performance.now() - time0) + " milliseconds from load to burndown chart.");
    // }

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
