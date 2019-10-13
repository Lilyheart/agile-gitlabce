var base_url;
var gitlab_key;
var project_id;
var curr_username;
var issue_list = [];

function get_header_value(url, header_value) {
  let request = new XMLHttpRequest();
  request.open("GET", url, false);
  request.send();

  let arr = request.getAllResponseHeaders().trim().split(/[\r\n]+/);
  let headerMap = {};

  arr.forEach(function (line) {
    let parts = line.split(': ');
    let header = parts.shift();
    let value = parts.join(': ');
    headerMap[header] = value;
  });

  return parseInt((headerMap[header_value]))
}

async function update_curr_username() {
  if (gitlab_key.length == 0) {
    curr_username = null;
  } else {
    let url = base_url + "user?private_token=" + gitlab_key

    console.log("Obtaining data at: " + url)
    await $.getJSON(url, function(data) {
      curr_username = data.username
    });
  }
}

async function get_project_list(url) {
  console.log(url)
  project_list = [];
  url = url + "projects?order_by=name&sort=asc&simple=true&private_token=" + gitlab_key

  // Get number of project pages
  projectPages = get_header_value(url, "x-total-pages")
  console.log("Total pages to fetch: " + projectPages)

  // Set up drowndown
  let dropdown = $('#project-dropdown');
  dropdown.empty();
  dropdown.append('<option selected="true" disabled>Choose Project</option>');
  dropdown.prop('selectedIndex', 0);

  // Fill dropdown
  console.log("Obtaining data at: " + url + "&page=1")
  for(i=1; i <= projectPages; i++) {
    await $.getJSON(url + "&page=" + i, function (data) {
      // TODO Alphabetize project list THEN make option list
      project_list = project_list.concat(data)
      $.each(data, function (key, entry) {
        let proj_name;
        if (curr_username == null || curr_username.length == 0) {
          proj_name = entry.name + " (" + entry.namespace.path + ")";
        } else {
          proj_name = entry.name;
        }
        dropdown.append($('<option></option>').attr('value', entry.id).text(proj_name));
      })
    });
  }

}

async function getProjects(projFilter) {
  set_phase("project_start")

  // Get and set variables
  base_url = document.getElementById("base_url").value;
  gitlab_key = document.getElementById("gitlab_key").value;

  // Set or clear username
  await update_curr_username();
  let url;

  // Build URL and get project list
  if(projFilter == "all" || curr_username == null) {
    url = base_url;
  } else {
    url = base_url + "users/" + curr_username + "/";
  }

  await get_project_list(url)

  $('#btnGetIssues').prop('disabled', true);
  set_phase("project_end")
}

function enableIssueBtn() {
  $('#btnGetIssues').prop('disabled', false);
}

async function get_issues_list(url) {
  // Get number of project pages
  projectPages = get_header_value(url, "x-total-pages")
  console.log("Total pages to fetch: " + projectPages)

  // Get Data
  issue_list = [];
  console.log("Obtaining data at: " + url + "&page=1")
  for(i=1; i <= projectPages; i++) {
    await $.getJSON(url + "&page=" + i, function(data) {
      issue_list = issue_list.concat(data)
    });
  }
}

async function getIssues() {
  set_phase("issue_start")

  // Get and set variables
  project_id = document.getElementById("project-dropdown").value;
  let url = base_url + "projects/" + project_id + "/issues?private_token=" + gitlab_key

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
  set_phase("issue_end")
}

async function testStuff() {

}

function set_phase(new_phase) {
  // set_phase(start, project_start, project_end, issue_start, issue_end)

  // loading_projects
  if (new_phase == "project_start") {
    document.getElementById("loading_projects").style.display = "block";
  } else {
    document.getElementById("loading_projects").style.display = "none";
  }

  // show_repo_options
  if (new_phase == "start" || new_phase == "project_start" ||
      curr_username == null || curr_username.length == 0) {
    document.getElementById("show_repo_options").style.display = "none";
  } else {
    document.getElementById("show_repo_options").style.display = "flex";
  }

  // gitlab_get_project
  if (new_phase == "start" || new_phase == "project_start") {
    document.getElementById("gitlab_get_project").style.display = "none";
  } else {
    document.getElementById("gitlab_get_project").style.display = "block";
  }

  // loading_issues
  if (new_phase == "issue_start") {
    document.getElementById("loading_issues").style.display = "block";
  } else {
    document.getElementById("loading_issues").style.display = "none";
  }

  // gitlab_show_issues
  if (new_phase == "issue_end") {
    document.getElementById("gitlab_show_issues").style.display = "block";
  } else {
    document.getElementById("gitlab_show_issues").style.display = "none";
  }

  // tabs
  if (new_phase == "issue_end") {
    document.getElementById("issues-tab").classList.add("active");
    document.getElementById("issues-tab").classList.remove("disabled");
    document.getElementById("burndown-tab").classList.remove("disabled");
  } else {
    document.getElementById("issues-tab").classList.remove("active");
    document.getElementById("issues-tab").classList.add("disabled");
    document.getElementById("burndown-tab").classList.add("disabled");
    document.getElementById("members-tab").classList.add("disabled");
    document.getElementById("settings-tab").classList.add("disabled");
  }
}

$( document ).ready(function() {
  $("#head").load("resources/header.html");
  set_phase("start");
  testStuff();
});
