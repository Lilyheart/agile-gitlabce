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
  if (new_phase == "start") {
    document.getElementById("loading_projects").style.display = "none";
    document.getElementById("show_repo_options").style.display = "none";
    document.getElementById("gitlab_get_project").style.display = "none";
        document.getElementById("btnRestart").style.display = "none";

    document.getElementById("loading_issues").style.display = "none";
    document.getElementById("gitlab_show_issues").style.display = "none";

    document.getElementById("loading_burndown").style.display = "none";
    document.getElementById("burndown").style.display = "none";

    document.getElementById("issues-tab").classList.add("disabled");
    document.getElementById("burndown-tab").classList.add("disabled");
    document.getElementById("members-tab").classList.add("disabled");
    document.getElementById("settings-tab").classList.add("disabled");
  }

  if (new_phase == "project_start") {
    document.getElementById("loading_projects").style.display = "block";
      document.getElementById("gitlab_get_project").style.display = "none";
  }

  if (new_phase == "project_end") {
    document.getElementById("loading_projects").style.display = "none";
    document.getElementById("gitlab_get_project").style.display = "block";
  }

  if (new_phase == "issue_start") {
    document.getElementById("loading_issues").style.display = "block";
    document.getElementById("loading_burndown").style.display = "block";
    document.getElementById("gitlab_show_issues").style.display = "none";

    document.getElementById("btnRestart").style.display = "block";
    $('#base_url').prop('disabled', true);
    $('#gitlab_key').prop('disabled', true);
    $('#btnGetProjects').prop('disabled', true);

    $('#radio1').prop('disabled', true);
    $('#radio2').prop('disabled', true);
    $('#project-dropdown').prop('disabled', true);
    $('#btnGetIssues').prop('disabled', true);
  }

  if (new_phase == "issue_end") {
    document.getElementById("loading_issues").style.display = "none";
    document.getElementById("gitlab_show_issues").style.display = "block";
  }

  if (new_phase == "burndown_start") {
    document.getElementById("loading_burndown").style.display = "block";
    document.getElementById("burndown").style.display = "none";
  }

  if (new_phase == "burndown_end") {
    document.getElementById("loading_burndown").style.display = "none";
    document.getElementById("burndown").style.display = "block";
  }

  // show_repo_options
  if (new_phase == "start" || new_phase == "project_start" ||
      curr_username == null || curr_username.length == 0) {
    document.getElementById("show_repo_options").style.display = "none";
  } else {
    document.getElementById("show_repo_options").style.display = "flex";
  }

  // tabs
  if (new_phase == "issue_start") {
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
