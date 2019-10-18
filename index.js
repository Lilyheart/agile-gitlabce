/*
See Scripts folder for additional Scripts.
This file contains general code and global variable declarations
*/

var currURL, baseURL, gitlabKey, projectID, currProjectName, stateHASH,
    clientID, redirectURI, authURL, currUserName, projectList, issueListArr,
    issueListJSON, milestoneList, accessToken, paramDict, time1,
    time0 = performance.now(),
    base36 = 36;

currURL = window.location.href;
redirectURI = window.location.origin + window.location.pathname;

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
    url = baseURL + "user?" + gitlabKey;

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
    let url = baseURL + "projects/" + projectID + "?" + gitlabKey;

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

    // $("#radio1").prop("disabled", false);
    // $("#radio2").prop("disabled", false);
    // $("#project-dropdown").prop("disabled", false);
    // $("#project-dropdown")[0].selectize.enable();
    // $("#btnGetIssues").prop("disabled", false);
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
  }

  // tabs
  if (newPhase === "burndown_start") {
    document.getElementById("burndown-tab").classList.remove("disabled");
  }
}

function restart() {
  location.href = redirectURI + "#access_token=" + accessToken;
  location.reload();
}

function authenticate() {
  stateHASH = Date.now().toString(base36);
  clientID = "06ed28b4a14e68fa4448b98c257f5c606971c971cbcfae43dab3ca6e5bf5e8a5";

  authURL = "https://gitlab.bucknell.edu/oauth/authorize";
  authURL += "?client_id=" + clientID;
  authURL += "&redirect_uri=" + currURL;
  authURL += "&response_type=token&state=" + stateHASH + "&scope=api";

  document.getElementById("gitlab-login-link").setAttribute("href", authURL);
}

function parsePARAMS(params) {
  let paramList, param;

  paramList = params.replace("?", "");
  paramList = params.replace("#", "");
  paramList = paramList.split("&");

  paramDict = {};
  paramList.forEach(function(element) {
    param = element.split("=");
    paramDict[param[0]] = param[1];
  });
}

$(document).ready(function() {
  if (window.location.hash.length !== 0 || accessToken) {
    setPhase("start");
    document.getElementById("gitlab-login-link").style.display = "none";
    document.getElementById("gitlab-logout-link").style.display = "block";
    document.getElementById("gitlab_setup").style.display = "none";
    document.getElementById("loading_projects").style.display = "block";
    parsePARAMS(window.location.hash);
    accessToken = paramDict.access_token;
    document.getElementById("gitlab_key").value = accessToken;
    if (history.pushState) {
      window.history.pushState("object or string", "Title", redirectURI);
    } else {
      document.location.href = redirectURI;
    }
    projects.getProjects("auto");
  } else {
    authenticate();
    setPhase("start");
  }

});
