/*
See Scripts folder for additional Scripts.
This file contains general code and global variable declarations
*/

var rootPage, baseURL, currURL, serverDetails, gitlabKey, feedbackRepo, projectID,
    currProjectName, currProjecURL, currProjStartDate, currUserName, projectList,
    lastUpdate, issueListArr, issueListJSON, milestoneList, spentTimeList,
    estimateTimeList, paramDict,
    searchDict = {},
    isBookmark = false,
    isLoaded = false;
const PERCENT = 100,
      MSperMIN = 60000;

let stateHASH, isCheckingUpdate, clientID, redirectURI,
    authURL, accessToken,
    spinnerText = "<span class='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span>";

$("#updateAlert").hide();
currURL = window.location.origin + window.location.pathname;
redirectURI = currURL;

$("#auth-server-dropdown").selectize({
  valueField: "id",
  labelField: "id",
  searchField: "id",
  options: gitlabServers,
  create: false
});

// $("#auth-server-dropdown").selectize()[0].selectize.setValue("Bucknell", false);

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

  // $.ajax({
  //   url: url,
  //   type: "GET",
  //   contentType: "application/json;charset=utf-8",
  //   async: true,
  //   success: function (data, status, xhr) {
  //     // console.log(data);
  //     // console.log(xhr.getAllResponseHeaders());
  //     request = xhr.getAllResponseHeaders();
  //     arr = request.trim().split(/[\r\n]+/);
  //     headerMap = {};
  //     arr.forEach(function (line) {
  //       parts = line.split(": ");
  //       header = parts.shift();
  //       value = parts.join(": ");
  //       headerMap[header] = value;
  //     });
  //     console.log(headerMap);
  //   },
  //   error: function () {
  //     console.log(url);
  //   }
  // });
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
      currProjecURL = data.web_url;
      currProjStartDate = new Date(data.created_at);
    });
  }
}

async function checkForUpdates() {
  let url, numUpdate;

  if (!(lastUpdate instanceof Date) || !isCheckingUpdate || $("#updateAlert")[0].style.display !== "none") {
    return;
  }

  url = baseURL + "projects/" + projectID + "/issues_statistics?" + gitlabKey
      + "&updated_after=" + lastUpdate.toJSON();

  // console.log("Obtaining data at: " + url);
  await $.getJSON(url, function(data) {
    numUpdate = parseInt(data.statistics.counts.all, 10);
  });

  if (numUpdate > 0) {
    $("#updateAlert").show();
  }
}

function displayUpdateAlert() {
  $("#updateAlert").show();
}

async function getAgilePlans() {
  let issueURL, projectPages, agilePlans,
      validTags = ["Bug", "Documentation", "Enhancement", "Suggestion", "Support"];

  issueURL = "https://gitlab.bucknell.edu/api/v4/projects/3878/issues?per_page=100&page=1";
  projectPages = getHeaderValue(issueURL, "x-total-pages");

  // Get Data
  agilePlans = [];
  for (let i = 1; i <= projectPages; i += 1) {
    await $.getJSON(issueURL + "&page=" + i, function(data) {
      agilePlans = agilePlans.concat(data);
    });
  }

  // Remove closed issues
  agilePlans = agilePlans.filter(issue => issue.state === "opened");

  for (let issueIndex in agilePlans) {
    if (agilePlans.hasOwnProperty(issueIndex)) {
      for (let i = (agilePlans[issueIndex].labels.length - 1); i >= 0; i -= 1) {
        if (validTags.indexOf(agilePlans[issueIndex].labels[i]) === -1) {
          agilePlans[issueIndex].labels.splice(i, 1);
        }
      }
    }
  }

  $("#agilePlans").DataTable({
    responsive: true,
    data: agilePlans,
    columns: [
      {title: "Type", data: "labels"},
      {title: "Title"}
    ],
    columnDefs: [{
      responsivePriority: 1, targets: 1
    }, {
      render: function ( data, type, row ) {
        return "<a href='" + row.web_url + "' target='_blank'>" + row.title + "</a>";

      },
      targets: 1
    }],
    searching: false,
    paging: false,
    info: false
  });
}

$(".alert .close").click(function() {
   $(this).parent().hide();
});

function setPhase(newPhase) {
  if (newPhase === "start" || newPhase === "oAuth") {
    document.getElementById("loading_projects").style.display = "none";
    document.getElementById("show_repo_options").style.display = "none";
    document.getElementById("radio1").checked = true;
    document.getElementById("gitlab_get_project").style.display = "none";

    document.getElementById("loading_burndown").style.display = "none";

    if (rootPage !== "report.html") {
      document.getElementById("loading_issues").style.display = "none";
      document.getElementById("gitlab_show_issues").style.display = "none";
      document.getElementById("burndown-unavailable").style.display = "none";
      document.getElementById("burndown").style.display = "none";
      document.getElementById("show_hours").style.display = "none";

      document.getElementById("release-unavailable").style.display = "none";
      document.getElementById("release").style.display = "none";
    }

  }

  if (newPhase === "oAuth") {
    document.getElementById("gitlab-login-link").style.display = "none";
    document.getElementById("gitlab-logout-link").style.display = "block";
    document.getElementById("loading_projects").style.display = "block";
    $("#auth-server-dropdown").prop("disabled", true);
    $("#auth-server-dropdown")[0].selectize.disable();
  }

  if (newPhase === "project_start") {
    document.getElementById("loading_projects").style.display = "block";
    document.getElementById("gitlab_get_project").style.display = "none";
    // if ($("#gitlab_auth_oauth")[0].classList.contains("active")) {
    //   $("#gitlab_auth_apikey")[0].classList.add("disabled");
    // } else {
    //   $("#gitlab_auth_oauth")[0].classList.add("disabled");
    // }

    $("#btnGetProjects").prop("disabled", true);
    if (!isBookmark) {$("#collapse-project").collapse("show");}
  }

  if (newPhase === "project_end") {
    document.getElementById("loading_projects").style.display = "none";
    document.getElementById("gitlab_get_project").style.display = "block";
    $("#btnGetProjects").prop("disabled", false);

    if (!isBookmark || !document.getElementById("radio0").checked) {
      $("#project-dropdown").prop("disabled", false);
      $("#project-dropdown")[0].selectize.enable();
    }
  }

  if (newPhase === "issue_start") {
    // Setup issues sections
    if (rootPage !== "report.html") {
      document.getElementById("issues-tab").classList.remove("disabled");
      isCheckingUpdate = false;
      if ((!isBookmark && !isLoaded) || document.getElementById("errors-tab").classList.contains("active")) {
        document.getElementById("issues-tab").click();
        document.getElementById("error-tab-item").classList.add("d-none");
      }
      isCheckingUpdate = true;
      document.getElementById("loading_issues").style.display = "block";
    } else {
      document.getElementById("project_report").classList.add("d-none");
    }
    if (rootPage !== "report.html") {
      document.getElementById("btnGetIssues").innerHTML = spinnerText + "&nbsp;&nbsp;Loading Issues";
      document.getElementById("gitlab_show_issues").style.display = "none";
      document.getElementById("issues-tab").classList.remove("disabled");
      if (!isBookmark) {$("#collapse-issue").collapse("show");}

      // Setup burndown sections
      document.getElementById("burndown-tab").classList.add("disabled");
      $("#burndown_progress").attr("aria-valuenow", 0).css("width", 0 + "%");

      // Setup release sections
      document.getElementById("release-tab").classList.add("disabled");
      $("#release_progress").attr("aria-valuenow", 0).css("width", 0 + "%");
    }

    // Disable changing any options
    $("#base_url").prop("disabled", true);
    $("#gitlab_key").prop("disabled", true);
    $("#btnGetProjects").prop("disabled", true);

    $("#radio0").prop("disabled", true);
    $("#radio1").prop("disabled", true);
    $("#radio2").prop("disabled", true);
    $("#project-dropdown").prop("disabled", true);
    $("#project-dropdown")[0].selectize.disable();
    $("#btnGetIssues").prop("disabled", true);
  }

  if (newPhase === "issue_end") {
    if (rootPage !== "report.html") {
      document.getElementById("loading_issues").style.display = "none";
      document.getElementById("gitlab_show_issues").style.display = "block";
    }
  }

  if (newPhase === "burndown_start") {
    document.getElementById("btnGetIssues").innerHTML = spinnerText + "&nbsp;&nbsp;Loading Burndown";
    if (rootPage !== "report.html") {
      document.getElementById("burndown").style.display = "none";
      document.getElementById("show_hours").style.display = "none";
      document.getElementById("burndown-tab").classList.remove("disabled");
      document.getElementById("release").style.display = "none";
      document.getElementById("release-tab").classList.remove("disabled");
    }
    document.getElementById("loading_burndown").style.display = "block";

  }

  if (newPhase === "burndown_end") {
    document.getElementById("loading_burndown").style.display = "none";
    if (rootPage !== "report.html") {
      document.getElementById("burndown").style.display = "block";
      document.getElementById("release").style.display = "block";
    }
    document.getElementById("show_hours").style.display = "block";
    document.getElementById("btnGetIssues").innerHTML = "Reload Issues";

    isLoaded = true;

    $("#radio0").prop("disabled", false);
    $("#radio1").prop("disabled", false);
    $("#radio2").prop("disabled", false);
    if (!isBookmark || !document.getElementById("radio0").checked) {
      $("#project-dropdown").prop("disabled", false);
      $("#project-dropdown")[0].selectize.enable();
    }
    $("#btnGetIssues").prop("disabled", false);
  }

  // show_repo_options
  if (newPhase === "start" || newPhase === "oAuth" || newPhase === "project_start" ||
      currUserName === null || currUserName.length === 0) {
    document.getElementById("show_repo_options").style.display = "none";
  } else {
    document.getElementById("show_repo_options").style.display = "flex";
  }
}

function reloadIssues() {
  // document.getElementById("issues-tab").click();
  issues.getIssues();
}

function restart() {
  location.href = redirectURI + "#access_token=" + accessToken;
  location.reload();
}

function setupAuthenticate(server) {
  serverDetails = defiant.json.search( gitlabServers, '//*[id="' + server + '"]' )[0];
  feedbackRepo = serverDetails.feedbackRepo;

  document.getElementById("base_url").value = serverDetails.baseURL;

  stateHASH = serverDetails.id;

  authURL = serverDetails.authURL;
  authURL += "?client_id=" + serverDetails.clientID;
  authURL += "&redirect_uri=" + redirectURI;
  authURL += "&response_type=token&state=" + stateHASH + "&scope=api";
}

function openAuthPage() {
  window.open(authURL, "_self");
}

function parseHASH(hash) {
  let paramList, param;

  paramList = hash.replace("?", "");
  paramList = paramList.replace("#", "");
  paramList = paramList.split("&");

  paramDict = {};
  paramList.forEach(function(element) {
    param = element.split("=");
    paramDict[param[0]] = param[1];
  });

  if (paramDict.hasOwnProperty("state")) {
    searchDict.server = paramDict.state;
  }
}

function parseSEARCH(search) {
  let searchList;

  searchList = search.replace("?", "");
  searchList = searchList.split("&");

  for (let line in searchList) {
    if (searchList.hasOwnProperty(line)) {
      line = searchList[line].split("=");
      searchDict[line[0]] = line[1];
    }
  }

  if (searchDict.hasOwnProperty("project")) {
    redirectURI += "?project=" + searchDict.project;
  }

  // Set Default server
  if (!searchDict.hasOwnProperty("server")) {
    searchDict.server = "Bucknell";
  }
}

function setFeedback() {
  let feedbackOptions = {};

  document.getElementById("faq-tab").click();

  feedbackOptions.appendTo = null;
  feedbackOptions.url = "https://agile-gitlab.prod.with-datafire.io/feedback";
  // feedbackOptions.url = "https://agile-gitlab.dev.with-datafire.io/feedback";
  feedbackOptions.elements = [{
    type: "email",
    name: "E-mail",
    label: "What is your email address?",
    required: false
  }, {
    type: "textarea",
    name: "Issue",
    label: "Please describe the issue you are experiencing or the feedback you wish to provide",
    required: true
  }];

  feedbackOptions.pages = [
      new window.Feedback.Form(feedbackOptions.elements)
      // new window.Feedback.Review()
  ];
  Feedback(feedbackOptions);
}

function setInit() {
  let scrollAnimate = 500;

  $("#estimate-type-dropdown").selectize();

  $(".collapse").on("shown.bs.collapse", function(event) {
    let $card = $(this).closest(".card");

    $("html,body").animate({
      scrollTop: $card.offset().top
    }, scrollAnimate);
  });

  // $("#burndownchart-types").DataTable({
  //   scrollY: "200px"
  // });

}

$(document).ready(function() {
  let searchString, newURL;

  rootPage = window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1);

  if (rootPage !== "report.html") {
    // setFeedback();
    getAgilePlans();
    setInit();
  }

  searchString = window.location.search;
  if (searchString.length !== 0) {
    isBookmark = true;
     parseSEARCH(searchString);
     if (searchDict.hasOwnProperty("project") && searchDict.hasOwnProperty("server")) {
       $("#auth-server-dropdown").selectize()[0].selectize.setValue(searchDict.server, false);
     }
     if (window.location.hash.length === 0) {
       setupAuthenticate(searchDict.server);
       openAuthPage();
     }
  }

  if (window.location.hash.length !== 0 || accessToken) {
    setPhase("oAuth");

    parseHASH(window.location.hash);
    $("#auth-server-dropdown").selectize()[0].selectize.setValue(paramDict.state, false);
    setupAuthenticate(paramDict.state);
    accessToken = paramDict.access_token;
    document.getElementById("base_url").value = serverDetails.baseURL;
    document.getElementById("gitlab_key").value = paramDict.access_token;

    if (searchDict.hasOwnProperty("project")) {
      newURL = currURL + "?server=" + serverDetails.id + "&project=" + searchDict.project;
    } else {
      newURL = currURL;
    }

    if (history.pushState) {
      window.history.pushState("object or string", "Title", newURL);
    }
    if (searchDict.hasOwnProperty("project")) {
      projects.getProjects("bookmarked");
    } else {
      projects.getProjects("auto");
    }
  } else {
    setupAuthenticate("Bucknell");
    setPhase("start");
  }

});
