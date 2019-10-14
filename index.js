/*
See Scripts folder for additional Scripts.
This file contains general code and global variable declarations
*/

var base_url;
var gitlab_key;
var project_id;
var curr_projectname;
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

async function update_projectname() {
  if (project_id.length == 0) {
    curr_projectname = null;
  } else {
    let url = base_url + "projects/" + project_id + "?private_token=" + gitlab_key

    console.log("Obtaining data at: " + url)
    await $.getJSON(url, function(data) {
      curr_projectname = data.name
    });
  }
}

function set_phase(new_phase) {
  // set_phase(start, project_start, project_end, issue_start, issue_end, burdown_end)

  // DIVS

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
  if (new_phase == "issue_end" || new_phase == "burdown_end") {
    document.getElementById("gitlab_show_issues").style.display = "block";
  } else {
    document.getElementById("gitlab_show_issues").style.display = "none";
  }

  // BUTTONS

  // gitlab_show_issues
  if (new_phase == "issue_end" || new_phase == "burdown_end") {
    document.getElementById("btnGetProjects").style.display = "block";
    $('#btnGetProjects').prop('disabled', true);
  } else {
    document.getElementById("btnGetProjects").style.display = "block";
    $('#btnGetProjects').prop('disabled', false);
  }

  // gitlab_show_issues
  if (new_phase == "issue_end" || new_phase == "burdown_end") {
    document.getElementById("btnGetIssues").style.display = "block";
    $('#btnGetIssues').prop('disabled', true);
  } else {
    document.getElementById("btnGetIssues").style.display = "block";
    $('#btnGetIssues').prop('disabled', false);
  }

  // gitlab_show_issues
  if (new_phase == "issue_end" || new_phase == "burdown_end") {
    document.getElementById("btnRestart").style.display = "block";
  } else {
    document.getElementById("btnRestart").style.display = "none";
  }

  document.getElementById("issues-tab").classList.remove("active");
  document.getElementById("issues-tab").classList.add("disabled");
  document.getElementById("burndown-tab").classList.add("disabled");
  document.getElementById("members-tab").classList.add("disabled");
  document.getElementById("settings-tab").classList.add("disabled");

  // tabs
  if (new_phase == "issue_end") {
    document.getElementById("issues-tab").classList.add("active");
    document.getElementById("issues-tab").classList.remove("disabled");
    document.getElementById("burndown-tab").classList.add("disabled");
    document.getElementById("members-tab").classList.add("disabled");
    document.getElementById("settings-tab").classList.add("disabled");
  }

  // tabs
  if (new_phase == "burdown_end") {
    document.getElementById("issues-tab").classList.add("active");
    document.getElementById("issues-tab").classList.remove("disabled");
    document.getElementById("burndown-tab").classList.remove("disabled");
    document.getElementById("members-tab").classList.add("disabled");
    document.getElementById("settings-tab").classList.add("disabled");
  }
}

function restart() {
  location.reload();
}

$( document ).ready(function() {
  $("#head").load("resources/header.html");
  set_phase("start");
});
