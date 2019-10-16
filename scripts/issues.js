var issues = (function () {

  function enableIssueBtn() {
    $("#btnGetIssues").prop("disabled", false);
  }

  async function getIssuesList() {
    let url, projectPages, issue;

    // Get number of project pages
    url = baseURL + "projects/" + projectID + "/issues?private_token=" + gitlabKey;
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
        issue = issueListArr[index];
        issueListJSON[issue.iid] = issue;
        issueListJSON[issue.iid].issues = [];
      }
    }
  }

  async function getMilestoneList() {
    let url, projectPages, tempMilestoneList, milestone, date;

    // Get number of project pages
    url = baseURL + "projects/" + projectID + "/milestones?private_token=" + gitlabKey;
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
        milestone = tempMilestoneList[index];
        milestoneList[milestone.iid] = milestone;
        milestoneList[milestone.iid].issues = [];
        //convert dates
        /* eslint-disable */
        date = milestoneList[milestone.iid].start_date.split("-");
        milestoneList[milestone.iid].start_date = new Date(date[0], date[1] - 1, date[2]);
        date = milestoneList[milestone.iid].due_date.split("-");
        milestoneList[milestone.iid].due_date = new Date(date[0], date[1] - 1, date[2]);
        /* eslint-enable */
      }
    }
  }

  async function loadIssueTable() {
    // Reset table
    $("#issuestable").dataTable().fnDestroy();
    $("#issuestablerows tr").remove();

    await getIssuesList();
    await getMilestoneList();

    $("#issuestable").DataTable({
      data: issueListArr,
      columns: [
        {data: "title"},
        {data: "state"},
        {data: "time_stats.human_time_estimate"}
      ],
      columnDefs: [{
        render: function ( data, type, row ) {
          return "<a href='" + row.web_url + "' target='_blank'>" + row.title + "</a>";
        },
        targets: 0
      }]
    });
  }

  async function getIssues() {
    setPhase("issue_start");

    // Get and set variables
    projectID = document.getElementById("project-dropdown").value;
    await updateProjectname();

    await loadIssueTable();
    setPhase("issue_end");

    await burndown.updateBurndownData("All");
  }

  return {
    getIssues: function() {
      getIssues();
    },

    enableIssueBtn: function() {
      enableIssueBtn();
    }
  };

})();
