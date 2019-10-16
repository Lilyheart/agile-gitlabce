/*
See Scripts folder for additional Scripts.
This file contains general code and global variable declarations
*/

var baseURL, gitlabKey, projectID, currProjectName,
    currUserName, projectList, issueListArr, issueListJSON, milestoneList, time1,
    time0 = performance.now();

function getHeaderValue(url, headerValue) {
  let request, arr, headerMap, parts, header, value;

  request = new XMLHttpRequest();
  request.open("GET", url, false);
  request.send();

  arr = request.getAllResponseHeaders().trim().split(/[\r\n]+/);
  headerMap = {};

  arr.forEach(function (line) {
    parts = line.split(": ");
    header = parts.shift();
    value = parts.join(": ");
    headerMap[header] = value;
  });

  return parseInt((headerMap[headerValue]), 10);
}

async function updateCurrUserName() {
  let url;

  if (gitlabKey.length === 0) {
    currUserName = null;
  } else {
    url = baseURL + "user?private_token=" + gitlabKey;

    console.log("Obtaining data at: " + url);
    await $.getJSON(url, function(data) {
      currUserName = data.username;
    });
  }
}

async function updateProjectname() {
  if (projectID.length === 0) {
    currProjectName = null;
  } else {
    let url = baseURL + "projects/" + projectID + "?private_token=" + gitlabKey;

    console.log("Obtaining data at: " + url);
    await $.getJSON(url, function(data) {
      currProjectName = data.name;
    });
  }
}

function setPhase(newPhase) {
  if (newPhase === "start") {
    document.getElementById("loading_projects").style.display = "none";
    document.getElementById("show_repo_options").style.display = "none";
    document.getElementById("radio1").checked = true;
    document.getElementById("gitlab_get_project").style.display = "none";
    document.getElementById("btnRestart").style.display = "none";

    document.getElementById("loading_issues").style.display = "none";
    document.getElementById("gitlab_show_issues").style.display = "none";

    document.getElementById("loading_burndown").style.display = "none";
    document.getElementById("burndown-unavailable").style.display = "none";
    document.getElementById("burndown").style.display = "none";

    document.getElementById("issues-tab").classList.remove("active");
    document.getElementById("issues-tab").classList.add("disabled");
    document.getElementById("burndown-tab").classList.add("disabled");
    document.getElementById("members-tab").classList.add("disabled");
    document.getElementById("settings-tab").classList.add("disabled");
  }

  if (newPhase === "project_start") {
    document.getElementById("loading_projects").style.display = "block";
    document.getElementById("gitlab_get_project").style.display = "none";
    $("#btnGetProjects").prop("disabled", true);
  }

  if (newPhase === "project_end") {
    document.getElementById("loading_projects").style.display = "none";
    document.getElementById("gitlab_get_project").style.display = "block";
    $("#btnGetProjects").prop("disabled", false);
  }

  if (newPhase === "issue_start") {
    document.getElementById("loading_issues").style.display = "block";
    document.getElementById("loading_burndown").style.display = "block";
    document.getElementById("gitlab_show_issues").style.display = "none";

    document.getElementById("btnRestart").style.display = "block";
    $("#base_url").prop("disabled", true);
    $("#gitlab_key").prop("disabled", true);
    $("#btnGetProjects").prop("disabled", true);

    $("#radio1").prop("disabled", true);
    $("#radio2").prop("disabled", true);
    $("#project-dropdown").prop("disabled", true);
    $("#project-dropdown")[0].selectize.disable();
    $("#btnGetIssues").prop("disabled", true);
  }

  if (newPhase === "issue_end") {
    document.getElementById("loading_issues").style.display = "none";
    document.getElementById("gitlab_show_issues").style.display = "block";
  }

  if (newPhase === "burndown_start") {
    document.getElementById("loading_burndown").style.display = "block";
    document.getElementById("burndown").style.display = "none";
  }

  if (newPhase === "burndown_end") {
    document.getElementById("loading_burndown").style.display = "none";
    document.getElementById("burndown").style.display = "block";
  }

  // show_repo_options
  if (newPhase === "start" || newPhase === "project_start" ||
      currUserName === null || currUserName.length === 0) {
    document.getElementById("show_repo_options").style.display = "none";
  } else {
    document.getElementById("show_repo_options").style.display = "flex";
  }

  // tabs
  if (newPhase === "issue_start") {
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

$(document).ready(function() {
  $("#head").load("resources/header.html");
  setPhase("start");
});
