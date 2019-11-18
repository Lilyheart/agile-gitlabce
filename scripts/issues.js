var issues = (function () {

  function enableIssueBtn() {
    document.getElementById("btnGetIssues").innerHTML = "Get Issues";
    $("#btnGetIssues").prop("disabled", false);
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
        }
        if (milestoneList[milestone.iid].due_date !== null) {
          dueDate = milestoneList[milestone.iid].due_date.split("-");
          dueDate = new Date(dueDate[0], dueDate[1] - 1, dueDate[2]);
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
    setPhase("issue_end");

    burndown.setBurndownUnloaded();
    await burndown.updateBurndownData("All");
  }

  return {
    getIssues: async function() {
      await getIssues();
    },

    enableIssueBtn: function() {
      enableIssueBtn();
    }
  };

})();
