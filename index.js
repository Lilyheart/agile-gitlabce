var base_url;
var gitlab_key;
var project_id;
var curr_username;

function get_header_value(url, header_value) {
  var request = new XMLHttpRequest();
  request.open("GET", url, false);
  request.send();

  var headers = request.getAllResponseHeaders();
  var arr = headers.trim().split(/[\r\n]+/);
  var headerMap = {};

  arr.forEach(function (line) {
    var parts = line.split(': ');
    var header = parts.shift();
    var value = parts.join(': ');
    headerMap[header] = value;
  });

  return parseInt((headerMap[header_value]))
}

async function get_curr_username() {
  var url = base_url + "user?private_token=" + gitlab_key

  await $.getJSON(url, function(data) {
    curr_username = data.username
  });
}

async function get_all_projects() {
  document.getElementById("loading_projects").style.display = "block";
  document.getElementById("gitlab_get_project").style.display = "none";
  document.getElementById("gitlab_show_issues").style.display = "none";

  var url = base_url + "projects?private_token=" + gitlab_key;

  // Get number of project pages
  projectPages = get_header_value(url, "x-total-pages")

  // Set up drowndown
  let dropdown = $('#project-dropdown');
  dropdown.empty();
  dropdown.append('<option selected="true" disabled>Choose Project</option>');
  dropdown.prop('selectedIndex', 0);

  // Fill dropdown
  for(i=1; i <= projectPages; i++) {
    await $.getJSON(url + "&page=" + i, function (data) {
      $.each(data, function (key, entry) {
        var proj_name = entry.name + " (" + entry.namespace.path + ")"
        dropdown.append($('<option></option>').attr('value', entry.id).text(proj_name));
      })
    });
  }
}

async function get_user_projects() {
  var url = base_url + "users/" + curr_username + "/projects?private_token=" + gitlab_key;

  // Get number of project pages
  projectPages = get_header_value(url, "x-total-pages")

  // Set up drowndown
  let dropdown = $('#project-dropdown');
  dropdown.empty();
  dropdown.append('<option selected="true" disabled>Choose Project</option>');
  dropdown.prop('selectedIndex', 0);

  // Fill dropdown
  for(i=1; i <= projectPages; i++) {
    await $.getJSON(url + "&page=" + i, function (data) {
      $.each(data, function (key, entry) {
        var proj_name = entry.name
        dropdown.append($('<option></option>').attr('value', entry.id).text(proj_name));
      })
    });
  }
}

async function getProjects(projFilter) {
  // Load loading spinner
  document.getElementById("loading_projects").style.display = "block";
  document.getElementById("gitlab_get_project").style.display = "none";
  document.getElementById("gitlab_show_issues").style.display = "none";

  // Get and set variables
  base_url = document.getElementById("base_url").value;
  gitlab_key = document.getElementById("gitlab_key").value;

  // Set or clear username
  if (gitlab_key.length == 0) {
    curr_username = null;
  } else {
    await get_curr_username();
  }

  if(projFilter == "all" || curr_username == null) {
    await get_all_projects()
  } else {
    await get_user_projects()
  }

  // Unhide next section
  document.getElementById("loading_projects").style.display = "none";
  document.getElementById("gitlab_get_project").style.display = "block";
  if (curr_username == null || curr_username.length == 0) {
    document.getElementById("show_repo_options").style.display = "none";
  } else {
    document.getElementById("show_repo_options").style.display = "flex";
  }
}

async function getIssues() {
  // Unhide next section
  document.getElementById("gitlab_show_issues").style.display = "block";

  // Get and set variables
  project_id = document.getElementById("project-dropdown").value;
  var url = base_url + "projects/" + project_id + "/issues?private_token=" + gitlab_key

  // Reset table
  $(".issueTable tr").remove();

  // Get number of project pages
  projectPages = get_header_value(url, "x-total-pages")

  // Get Data
  for(i=1; i <= projectPages; i++) {
    await $.getJSON(url + "&page=" + i, function(data) {
      for (var i = 0; i < data.length; i++) {
          tr = $('<tr/>');
          tr.append("<td>" + data[i].title + "</td>");
          tr.append("<td>" + data[i].state + "</td>");
          tr.append("<td>" + data[i].time_stats.human_time_estimate + "</td>");
          $('.issueTable').append(tr);
      }
    });
  }
}

$( document ).ready(function() {
  // Hide other sections
  document.getElementById("show_repo_options").style.display = "none";
  document.getElementById("loading_projects").style.display = "none";
  document.getElementById("gitlab_get_project").style.display = "none";
  document.getElementById("gitlab_show_issues").style.display = "none";
});
