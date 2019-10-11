var base_url;
var gitlab_key;
var project_id;
var curr_username;

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
    url = base_url + "projects?order_by=name&sort=asc&private_token=" + gitlab_key;
  } else {
    url = base_url + "users/" + curr_username + "/projects?order_by=name&sort=asc&private_token=" + gitlab_key;
  }
  get_project_list(url)

  set_phase("project_end")
}

async function getIssues() {
  set_phase("issue_start")

  // Get and set variables
  project_id = document.getElementById("project-dropdown").value;
  let url = base_url + "projects/" + project_id + "/issues?private_token=" + gitlab_key

  // Reset table
  $("#issuestable").dataTable().fnDestroy()
  $("#issuestablerows tr").remove();

  // Get number of project pages
  projectPages = get_header_value(url, "x-total-pages")

  // Get Data
  console.log("Obtaining data at: " + url + "&page=1")
  for(i=1; i <= projectPages; i++) {
    await $.getJSON(url + "&page=" + i, function(data) {
      for (let i = 0; i < data.length; i++) {
        let time_est;
        if(data[i].time_stats.human_time_estimate == null) {
          time_est = "";
        } else {
          time_est = data[i].time_stats.human_time_estimate;
        }
        // Set table data
        tr = $('<tr/>');
        tr.append("<td><a href='" + data[i].web_url + "' target='_blank'>" + data[i].title + "</a></td>");
        tr.append("<td>" + data[i].state + "</td>");
        tr.append("<td>" + time_est + "</td>");
        $('.issueTable').append(tr);
      }
    });
  }

  $('#issuestable').DataTable();
  set_phase("issue_end")
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
  } else {
    document.getElementById("issues-tab").classList.remove("active");
    document.getElementById("issues-tab").classList.add("disabled");
    document.getElementById("burndown-tab").classList.add("disabled");
    document.getElementById("members-tab").classList.add("disabled");
    document.getElementById("settings-tab").classList.add("disabled");
  }
}

$( document ).ready(function() {
  set_phase("start")
});
