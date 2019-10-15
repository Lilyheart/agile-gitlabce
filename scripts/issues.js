var issues = (function () {

  function enableIssueBtn() {
    $("#btnGetIssues").prop("disabled", false);
  }

  async function getIssuesList(url) {
    let projectPages;

    // Get number of project pages
    projectPages = getHeaderValue(url, "x-total-pages");

    // Get Data
    issueList = [];
    console.log("Obtaining data at: " + url + "&page=1 of " + projectPages + " page(s)");
    for (let i = 1; i <= projectPages; i += 1) {
      await $.getJSON(url + "&page=" + i, function(data) {
        issueList = issueList.concat(data);
      });
    }
  }

  async function loadIssueTable(url) {
    // Reset table
    $("#issuestable").dataTable().fnDestroy();
    $("#issuestablerows tr").remove();

    await getIssuesList(url);

    $("#issuestable").DataTable({
      data: issueList,
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
    let url;

    setPhase("issue_start");

    // Get and set variables
    projectID = document.getElementById("project-dropdown").value;
    url = baseURL + "projects/" + projectID + "/issues?private_token=" + gitlabKey;
    await updateProjectname();

    await loadIssueTable(url);
    setPhase("issue_end");

    await burndown.updateBurndownData();
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
