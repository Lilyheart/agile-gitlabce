/*eslint id-length: ["error", { "exceptions": ["i", "x", "y"] }]*/
var release = (function () {
  let today, idealEffort, remainEffort, trendEffort, selectedMilestones, selectedIssues,
      estimateStyle = "Final",
      isLoaded = false;
  const SECperHOUR = 3600,
        // eslint-disable-next-line no-magic-numbers
        MSperDAY = (1000 * 60 * 60 * 24),
        TWOdigitROUND = 100;

  function jsonToChartSeries(source, xlabel, ylabel, filter) {
    let filteredJSON, chartSeries;

    // for each note, determine if it's from an issue of interest
    // eslint-disable-next-line no-undefined
    if (filter !== undefined) {
      filteredJSON = source.filter(row => filter[1].includes(row.issue));
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

  function updateData() {
    let startDate, endDate, startHours, issueIID, dayDiff, idealDaily, day1, spentCummList, effort, effortDay, thisDay,
    mssData = [];

    for (let msIndex in selectedMilestones) {
      if (selectedMilestones.hasOwnProperty(msIndex)) {
        mssData.push(milestoneList[selectedMilestones[msIndex]]);
      }
    }

    idealEffort = [];
    remainEffort = [];
    trendEffort = [];

    // ******************************* Ideal *******************************
    // ***************************** Remaining *****************************

    // Find extreme start and end dates of milestones.
    for (let index in mssData) {
      if (mssData.hasOwnProperty(index)) {
        if (index === "0") {
          startDate = mssData[index].start_date;
          endDate = mssData[index].due_date;
          selectedIssues = mssData[index].issues;
        } else {
          if (startDate > mssData[index].start_date) {
            startDate = mssData[index].start_date;
          }
          if (endDate < mssData[index].due_date) {
            endDate = mssData[index].due_date;
          }
          selectedIssues = selectedIssues.concat(mssData[index].issues.filter((item) => selectedIssues.indexOf(item) < 0));
        }
      }
    }

    // Sum total Ideal/Remaining Hours

    startHours = 0;

    for (let issue in selectedIssues) {
      if (selectedIssues.hasOwnProperty(issue)) {
        issueIID = selectedIssues[issue];
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

    spentCummList = jsonToChartSeries(spentTimeList, "date", "spent", ["issue", selectedIssues]);

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
    $("#release-dropdown").selectize()[0].selectize.destroy();
    $("#release-dropdown").selectize({
      plugins: ["remove_button", "drag_drop"],
      delimiter: ",",
      persist: false,
      valueField: "iid",
      labelField: "dropdownText",
      searchField: "dropdownText",
      options: Object.values(milestoneList),
      disabledField: "disabled",
      create: false
    });

  }

  async function updateRelease() {
    let title, footnote, subtitle;

    await checkForUpdates();

    if (!isLoaded) {
      if (gitlabKey === "") {
        setPhase("release_start");
        setPhase("release_end");
        document.getElementById("release-unavailable").style.display = "block";
        document.getElementById("release-selection").style.display = "none";

        return;
      }
      setPhase("release_start");
      await createMilestoneDD();
      isLoaded = true;
    }

    if (selectedMilestones.length === 0) {
      idealEffort = [];
      remainEffort = [];
      trendEffort = [];
      selectedIssues = [];
    } else {
      updateData(selectedMilestones);
    }

    title = document.getElementById("release-name").value;

    subtitle = currProjectName;

    if (selectedMilestones.length !== 0) {
      subtitle += " [";
      for (let msIndex in selectedMilestones) {
        if (selectedMilestones.hasOwnProperty(msIndex)) {
          if (msIndex !== "0") {
            subtitle += ", ";
          }
          subtitle += milestoneList[selectedMilestones[msIndex]].title;
        }
      }
      subtitle += "]";
    }

    if (estimateStyle === "Final") {
      footnote = "Using final estimates only";
    } else { //"Changes"
      footnote = "Showing changes in estimates";
    }

    $(function () {
      $("#release-chart").highcharts({
        title: {text: title + " Release Chart"},
        subtitle: {text: subtitle},
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
          name: "Ideal Release",
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
          data: jsonToChartSeries(spentTimeList, "date", "spent", ["issue", selectedIssues])
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

    setPhase("release_end");
  }

  return {
    updateRelease: async function(newMilestone) {
      if ((newMilestone === "Auto" && !selectedMilestones) || (newMilestone === "")) {
        selectedMilestones = [];
      } else if (newMilestone === "Auto") {
        // No changes to selectedMilestone
      } else {
        selectedMilestones = newMilestone.split(",").map(Number);
      }
      today = new Date();
      today = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      await updateRelease();

      return;
    },
    setReleaseUnloaded: function() {
      isLoaded = false;
    },
    setEstimateStyle: function(newstyle) {
      estimateStyle = newstyle;
      updateRelease();
    }
  };

})();
