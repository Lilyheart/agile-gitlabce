function enableIssueBtn() {
  $('#btnGetIssues').prop('disabled', false);
}

async function load_issue_table(url) {
  // Reset table
  $("#issuestable").dataTable().fnDestroy()
  $("#issuestablerows tr").remove();

  await get_issues_list(url);

  $('#issuestable').DataTable({
    data: issue_list,
    columns: [
      { "data": "title"},
      { "data": "state"},
      { "data": "time_stats.human_time_estimate"}
    ],
    "columnDefs": [{
      "render": function ( data, type, row ) {
        return "<a href='" + row.web_url + "' target='_blank'>" + row.title + "</a>"
      },
      "targets": 0
    }]
  });
}

async function get_issues_list(url) {
  // Get number of project pages
  projectPages = get_header_value(url, "x-total-pages")

  // Get Data
  issue_list = [];
  console.log("Obtaining data at: " + url + "&page=1 of " + projectPages + " page(s)")
  for(i=1; i <= projectPages; i++) {
    await $.getJSON(url + "&page=" + i, function(data) {
      issue_list = issue_list.concat(data)
    });
  }
}

async function getIssues() {
  set_phase("issue_start");

  // Get and set variables
  project_id = document.getElementById("project-dropdown").value;
  let url = base_url + "projects/" + project_id + "/issues?private_token=" + gitlab_key;

  await load_issue_table(url);
  set_phase("issue_end");

  await update_burndown_data();
  set_phase("burdown_end");
}
