var issues = (function () {
  let issueErrorArr;

  function enableIssueBtn() {
    document.getElementById("btnGetIssues").innerHTML = "Get Issues";
    $("#btnGetIssues").prop("disabled", false);
  }

  function loadErrorTable() {
    let label, errCount, warnCount;

    if (issueErrorArr.length === 0) {
      return;
    }

    errCount = issueErrorArr.filter(issue => issue.hasOwnProperty("error")).length;
    warnCount = issueErrorArr.filter(issue => issue.hasOwnProperty("warning")).length;

    // Set label
    label = "There";
    if (issueErrorArr.length === 1) {
      label += " is ";
    } else {
      label += " are ";
    }
    if (errCount > 0) {
      label += errCount;
      label += " error";
      if (errCount > 1) {
        label += "s";
      }
      if (issueErrorArr.length > errCount) {
        label += " and ";
      }
    }
    if (warnCount > 0) {
      label += warnCount;
      label += " warning";
      if (warnCount > 1) {
        label += "s";
      }
    }
    label += ".";

    // Set visuals
    document.getElementById("error-counts").innerHTML = label;

    if (errCount !== 0 && warnCount !== 0) {
      label = errCount + "/" + warnCount;
    } else {
      label = issueErrorArr.length;
    }
    if (rootPage !== "report.html") {
      if (errCount > 0) {
        document.getElementById("errors-tab").innerHTML = "Errors <span class='badge badge-light'>" + label + "</span>";
        document.getElementById("errors-tab").classList.add("error");
      } else if (warnCount > 0) {
        document.getElementById("errors-tab").innerHTML = "Warnings <span class='badge badge-light'>" + label + "</span>";
        document.getElementById("errors-tab").classList.remove("error");
      }
    }

    if (errCount > 0) {
      document.getElementById("issue_error_section").style.display = "block";
    } else {
      document.getElementById("issue_error_section").style.display = "none";
    }
    if (warnCount > 0) {
      document.getElementById("issue_warning_section").style.display = "block";
    } else {
      document.getElementById("issue_warning_section").style.display = "none";
    }

    // Reset error table
    if ( $.fn.dataTable.isDataTable( "#issueerrorstable" ) ) {
      $("#issueerrorstable").dataTable().fnDestroy();
      $("#issueerrorstablerows tr").remove();
    }
    $("#issueerrorstable").DataTable({
      responsive: true,
      searching: false,
      lengthChange: false,
      data: issueErrorArr.filter(issue => issue.hasOwnProperty("error")),
      columns: [
        {title: "Issue", data: "error"},
        {title: "Title", data: "title"},
        {title: "State", data: "state"},
        {title: "Time Spent", className: "none", data: "time_stats.human_total_time_spent"},
        {title: "Time Est.", className: "none", data: "time_stats.human_time_estimate"},
        {title: "Assigned", className: "none", data: "assignee"}
      ],
      columnDefs: [{
        targets: 0, width: 250, responsivePriority: 1
      }, {
        targets: 1, width: 600, responsivePriority: 1,
        render: function ( data, type, row ) {
          return "<a href='" + row.web_url + "' target='_blank'>" + row.title + "</a>";
        }
      }, {
        targets: 3,
        render: function ( data, type, row ) {
          if (row.time_stats.human_total_time_spent === null) {
            return "None";
          } else {
            return row.time_stats.human_total_time_spent;
          }
        }
      }, {
        targets: 5,
        render: function ( data, type, row ) {
          if (row.assignee === null) {
            return "None";
          } else {
            return row.assignee.name;
          }
        }
      }]
    });

    // Reset warning table
    if ( $.fn.dataTable.isDataTable( "#issuewarningstable" ) ) {
      $("#issuewarningstable").dataTable().fnDestroy();
      $("#issuewarningstablerows tr").remove();
    }
    $("#issuewarningstable").DataTable({
      responsive: true,
      searching: false,
      lengthChange: false,
      data: issueErrorArr.filter(issue => issue.hasOwnProperty("warning")),
      columns: [
        {title: "Issue", data: "warning"},
        {title: "Title", data: "title"},
        {title: "State", data: "state"},
        {title: "Time Spent", className: "none", data: "time_stats.human_total_time_spent"},
        {title: "Time Est.", className: "none", data: "time_stats.human_time_estimate"},
        {title: "Assigned", className: "none", data: "assignee"}
      ],
      columnDefs: [{
        targets: 0, width: 250, responsivePriority: 1
      }, {
        targets: 1, width: 600, responsivePriority: 1,
        render: function ( data, type, row ) {
          return "<a href='" + row.web_url + "' target='_blank'>" + row.title + "</a>";
        }
      }, {
        targets: 3,
        render: function ( data, type, row ) {
          if (row.time_stats.human_total_time_spent === null) {
            return "None";
          } else {
            return row.time_stats.human_total_time_spent;
          }
        }
      }, {
        targets: 5,
        render: function ( data, type, row ) {
          if (row.assignee === null) {
            return "None";
          } else {
            return row.assignee.name;
          }
        }
      }]
    });

    // Display tab
    if (rootPage !== "report.html") {
      document.getElementById("errors-tab").classList.remove("disabled");
      document.getElementById("error-tab-item").classList.remove("d-none");
    }
  }

  function addIssueError(issue, errorMessage) {
    let newIssue = JSON.parse(JSON.stringify(issue));

    newIssue.error = errorMessage;
    issueErrorArr.push(newIssue);
  }

  function addIssueWarning(issue, warningMessage) {
    let newIssue = JSON.parse(JSON.stringify(issue));

    newIssue.warning = warningMessage;
    issueErrorArr.push(newIssue);
  }

  async function checkForErrors() {
    let issue;

    issueErrorArr = [];

    if (rootPage !== "report.html") {
      document.getElementById("errors-tab").classList.add("disabled");
      document.getElementById("error-tab-item").classList.add("d-none");
    }

    for (let issueIndex in issueListArr) {
      if (issueListArr.hasOwnProperty(issueIndex)) {
        issue = issueListArr[issueIndex];
        if (issue.time_stats.time_estimate === 0) {
          // Issues no estimate and either has time spent (error) or is open (warning)
          if (issue.time_stats.total_time_spent > 0) {
            addIssueError(issue, "Spent time with no estimate");
          }
          if (issue.time_stats.total_time_spent === 0 && issue.state === "opened") {
            addIssueWarning(issue, "Missing estimate");
          }
        } else if (issue.time_stats.total_time_spent > issue.time_stats.time_estimate) {
          // Issues with spend > estimate (report differently than the previous line)
          addIssueError(issue, "More spent time than estimated");
        } else if ((issue.time_stats.total_time_spent < issue.time_stats.time_estimate) && issue.state === "closed") {
          // Issues with spend > estimate (report differently than the previous line)
          addIssueError(issue, "Unspent time on closed issue");
        }
      }
    }
  }

  async function getIssuesList() {
    let projectName, url, projectPages, issue;

    if (history.pushState) {
      window.history.pushState("object or string", "Title", currURL + "?project=" + projectID);
      window.history.pushState("object or string", "Title", currURL + "?server=" + serverDetails.id + "&project=" + projectID);
    }

    projectName = $("#project-dropdown")[0].selectize.getOption($("#project-dropdown")[0].selectize.getValue())[0].innerHTML;

    document.title = projectName + " (Agile Gitlab CE)";

    // Get number of project pages
    url = baseURL + "projects/" + projectID + "/issues?per_page=100&" + gitlabKey;
    projectPages = getHeaderValue(url, "x-total-pages");

    // Get Data
    issueListArr = [];
    console.log("Obtaining data at: " + url + "&page=1 of " + projectPages + " page(s)");
    for (let i = 1; i <= projectPages; i += 1) {
      await $.getJSON(url + "&page=" + i, function(data) {
        issueListArr = issueListArr.concat(data);
      });
    }

    issueListJSON = {};
    for (let index in issueListArr) {
      if (issueListArr.hasOwnProperty(index)) {
        // Build JSON
        issue = issueListArr[index];
        issueListJSON[issue.iid] = issue;
        issueListJSON[issue.iid].issues = [];

        // Set miletone variable for DataTabale
        if (issueListArr[index].milestone === null) {
          issueListArr[index].milestone = {title: ""};
        }
      }
    }
  }

  async function getMilestoneList() {
    let url, projectPages, tempMilestoneList, milestone, startDate, dueDate,
        today = new Date(new Date().setHours(0, 0, 0, 0));

    // Get number of project pages
    url = baseURL + "projects/" + projectID + "/milestones?" + gitlabKey;
    projectPages = getHeaderValue(url, "x-total-pages");

    // Get Data
    tempMilestoneList = [];
    console.log("Obtaining data at: " + url + "&page=1 of " + projectPages + " page(s)");
    for (let i = 1; i <= projectPages; i += 1) {
      await $.getJSON(url + "&page=" + i, function(data) {
        tempMilestoneList = tempMilestoneList.concat(data);
      });
    }

    milestoneList = {};
    milestoneList["None"] = {iid: "None", title: "All Issues without a milestone", issues: []};
    milestoneList["All"] = {iid: "All", title: "All Issues", issues: []};
    for (let index in tempMilestoneList) {
      if (tempMilestoneList.hasOwnProperty(index)) {
        startDate = dueDate = "";
        milestone = tempMilestoneList[index];
        milestoneList[milestone.iid] = milestone;
        milestoneList[milestone.iid].issues = [];
        //convert dates

        if (milestoneList[milestone.iid].start_date !== null) {
          startDate = milestoneList[milestone.iid].start_date.split("-");
          startDate = new Date(startDate[0], startDate[1] - 1, startDate[2]);
          startDate = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
        }
        if (milestoneList[milestone.iid].due_date !== null) {
          dueDate = milestoneList[milestone.iid].due_date.split("-");
          dueDate = new Date(dueDate[0], dueDate[1] - 1, dueDate[2]);
          dueDate = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
        }

        /* eslint-disable */
        if (startDate !== "") {
          milestoneList[milestone.iid].start_date = startDate;
        } else if (dueDate !== "") {
          milestoneList[milestone.iid].start_date = dueDate;
        } else {
          milestoneList[milestone.iid].start_date = today;
        }
        if (dueDate !== "") {
          milestoneList[milestone.iid].due_date = dueDate;
        } else if (startDate !== "") {
          milestoneList[milestone.iid].due_date = startDate;
        } else {
          milestoneList[milestone.iid].due_date = today;
        }
        /* eslint-enable */
      }
    }
  }

  async function loadIssueTable() {

    await getIssuesList();
    await getMilestoneList();

    // Reset table
    if ( $.fn.dataTable.isDataTable( "#issuestable" ) ) {
      $("#issuestable").dataTable().fnDestroy();
      $("#issuestablerows tr").remove();
    }

    $("#issuestable").DataTable({
      responsive: true,
      data: issueListArr,
      columns: [
        {title: "Title"},
        {title: "State", data: "state"},
        {title: "Milestone", data: "milestone.title"},
        {title: "Time Spent", className: "none", data: "time_stats.human_total_time_spent"},
        {title: "Time Est.", className: "none", data: "time_stats.human_time_estimate"},
        {title: "Assigned", className: "none", data: "assignee"}
      ],
      columnDefs: [{
        width: 800, targets: 0
      }, {
        responsivePriority: 1, targets: 0
      }, {
        responsivePriority: 2, targets: 1
      }, {
        render: function ( data, type, row ) {
          if (row.time_stats.human_total_time_spent === null) {
            return "None";
          } else {
            return row.time_stats.human_total_time_spent;
          }
        }, targets: 3
      }, {
        render: function ( data, type, row ) {
          if (row.assignee === null) {
            return "None";
          } else {
            return row.assignee.name;
          }
        }, targets: 5
      }, {
        render: function ( data, type, row ) {
          return "<a href='" + row.web_url + "' target='_blank'>" + row.title + "</a>";
        }, targets: 0
      }]
    });
  }

  async function getIssues() {
    setPhase("issue_start");
    $("#updateAlert").hide();
    lastUpdate = new Date();

    // Get and set variables
    projectID = document.getElementById("project-dropdown").value;
    await updateProjectname();

    await loadIssueTable();
    checkForErrors();
    setPhase("issue_end");

    burndown.setBurndownUnloaded();
    release.setReleaseUnloaded();
    await burndown.updateBurndown("Auto");
    if (rootPage !== "report.html") {
      await release.updateRelease("Auto");
    } else {
      await report.loadReport();
    }
  }

  return {
    getIssues: async function() {
      await getIssues();
    },

    enableIssueBtn: function() {
      enableIssueBtn();
    },

    addIssueError: function(issue, errorMessage) {
      addIssueError(issue, errorMessage);
    },

    addIssueWarning: function(issue, warningMessage) {
      addIssueWarning(issue, warningMessage);
    },

    loadErrorTable: function() {
      loadErrorTable();
    }
  };

})();
