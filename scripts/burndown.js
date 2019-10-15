var burndown = (function () {

  let startHours, startDate, endDate, spentTimeList, idealEffort, remainEffort, issueNotesList;
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
  /* eslint-enable */

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

  function jsonToSeries(json, xlabel, ylabel) {
    // Reduce json
    let series = Object.values(json.reduce((acc, cur) => {
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

    return series;
  }

  async function getData() {
    let issueIID, url, noteRE, body, match, time, spent, date, dayDiff, idealDaily, day1, spentCummList, effort, effortDay, thisDay;

    issueNotesList = [];
    startDate = issueListArr[0].created_at;
    endDate = issueListArr[0].updated_at;

    // Get data from issues
    startHours = 0;
    for (let issue in issueListArr) {
      if (issueListArr.hasOwnProperty(issue)) {
        // Accumlate hours
        startHours += issueListArr[issue].time_stats.time_estimate / SECperHOUR;
        // Update dates
        if (startDate > issueListArr[issue].created_at) {startDate = issueListArr[issue].created_at;}
        if (endDate < issueListArr[issue].updated_at) {endDate = issueListArr[issue].updated_at;}

        // Get Notes
        issueIID = issueListArr[issue].iid;
        url = baseURL + "projects/" + projectID + "/issues/" + issueIID + "/notes";

        if (gitlabKey.length > 0) {
          url += "?&private_token=" + gitlabKey;
        }

        if (issueListArr[issue].milestone !== null) {
          milestoneList[issueListArr[issue].milestone.iid].issues.push(issueListArr[issue].iid);
        } else {
          milestoneList["None"].issues.push(issueListArr[issue].iid);
        }

        await getIssueNotes(url);
      }
    }
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    // Go through notes to get changes in spend
    noteRE = /(added|subtracted) (.*) of time spent at (.*)-(.*)-(.*)/;
    spentTimeList = [];
    issueNotesList.forEach(function(note) {
      body = note.body;
      match = body.match(noteRE);

      // If time spent was changed
      if (match !== null) {
        // parse spent
        time = match[2].match(/([0-9]*)([a-zA-Z]*)/);
        spent = time[1] * CONVERTTABLE[time[2]];
        // update if subtracted
        if (match[1] === "subtracted") {spent *= INVERSE;}
        // parse date
        date = Date.UTC(parseInt(match[3], 10), parseInt(match[4], 10) - 1, parseInt(match[5], 10));
        spentTimeList.push({date: date, spent: spent, issue: note.noteable_iid, author: note.author.name});
      }
    });

    // Create Cummulative lines
    dayDiff = Math.floor((endDate - startDate) / MSperDAY);
    idealDaily = startHours / dayDiff;

    idealEffort = [];
    remainEffort = [];
    day1 = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    idealEffort.push([day1, startHours]);
    remainEffort.push([day1, startHours]);

    spentCummList = jsonToSeries(spentTimeList, "date", "spent");

    for (let i = 0; i <= dayDiff; i += 1) {
      effort = Math.max(0, Math.round((startHours - (idealDaily * i)) * TWOdigitROUND) / TWOdigitROUND);
      effortDay = day1 + (MSperDAY * i);
      idealEffort.push([effortDay, effort]);

      thisDay = spentCummList.filter(item => item.x === effortDay);
      if (thisDay.length === 0) {
        effort = remainEffort[i][1];
      } else {
        effort = remainEffort[i][1] - thisDay[0].y;
      }
      remainEffort.push([effortDay, effort]);
    }
    idealEffort.shift();
    remainEffort.shift();
  }

  async function updateBurndownData() {
    if (gitlabKey === "") {
      setPhase("burndown_end");
      document.getElementById("burndown-unavailable").style.display = "block";

      return;
    }
    setPhase("burndown_start");
    await getData();

    $(function () {
      $("#burndown").highcharts({
        title: {text: "Project Burndown Chart"},
        subtitle: {text: currProjectName},
        xAxis: {
          type: "datetime",
          title: {text: "Date"},
          // tickInterval: 86400000,
          labels: {
            format: "{value:%m/%d/%Y}",
            rotation: -30
          }
        },
        yAxis: {
          title: {text: "Hours"}
        },
        tooltip: {
          valueSuffix: " hrs"
        },
        legend: {
          layout: "vertical",
          align: "right",
          verticalAlign: "middle",
          borderWidth: 1
        },
        series: [{
          type: "column",
          name: "Completed Tasks",
          color: "#4682b4",
          data: jsonToSeries(spentTimeList, "date", "spent")
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
        }]
      });
    });

    setPhase("burndown_end");
  }

  return {
    updateBurndownData: function() {
      updateBurndownData();
    }
  };

})();
