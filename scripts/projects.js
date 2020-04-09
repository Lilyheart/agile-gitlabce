var projects = (function () {

  function urlExists(url, callback) {
    fetch(url, {method: "head"})
    .then(function(status) {
      callback(status.ok);
    });
  }

  async function getProjectList(projFilter) {
    // projFilter = ["user", "all", "auto", "bookmarked"]
    let url, projectPages;

    // survey.surveyInit();

    // Build URL and get project list
    if (projFilter === "all" || currUserName === null) {
      url = baseURL + "projects?order_by=name&sort=asc&simple=true&" + gitlabKey;
    } else if (projFilter === "user" || projFilter === "auto") {
      url = baseURL + "projects?order_by=name&min_access_level=40&sort=asc&simple=true&" + gitlabKey;
    } else if (projFilter === "bookmarked") {
      url = baseURL + "projects/" + searchDict.project + "?" + gitlabKey;
    } else {
      console.log("Project Error.  Selected " + projFilter);

      return;
    }

    projectList = [];

    // Get number of project pages
    if (projFilter === "bookmarked") {
      projectPages = 1;
    } else {
      projectPages = getHeaderValue(url, "x-total-pages");
    }


    // Obtain data for dropdown
    console.log("Obtaining data at: " + url + "&page=1 of " + projectPages + " page(s)");

    for (let i = 1; i <= projectPages; i += 1) {
      await $.getJSON(url + "&page=" + i, function (data) {
        projectList = projectList.concat(data);
      });
    }

    // Add field for dropdown text
    for (let project in projectList) {
      if (projectList.hasOwnProperty(project)) {
          if (currUserName === null || currUserName.length === 0 || currUserName !== projectList[project].namespace.path) {
            projectList[project].dropdownText = projectList[project].name + " (" + projectList[project].namespace.path + ")";
          } else {
            projectList[project].dropdownText = projectList[project].name;
          }
      }
    }

    // Remove any previous selectize and redraw
    $("#project-dropdown").selectize()[0].selectize.destroy();
    $("#project-dropdown").selectize({
      valueField: "id",
      labelField: "dropdownText",
      searchField: "dropdownText",
      options: projectList,
      create: false
    });

    if (projFilter === "bookmarked") {
      document.getElementById("radio0").checked = true;
      document.getElementById("radio1").checked = false;
      document.getElementById("radio2").checked = false;
      $("#bookmark-input")[0].classList.remove("d-none");
      $("#project-dropdown").selectize()[0].selectize.setValue(searchDict.project, false);
      issues.getIssues();
    }
  }

  async function getProjects(projFilter) {
    let url, alert,
        projectData = [];

    setPhase("project_start");

    // Get and set variables
    baseURL = document.getElementById("base_url").value;
    if (!paramDict || paramDict.length === 0) {
      gitlabKey = "private_token=" + document.getElementById("gitlab_key").value;
    } else {
      gitlabKey = "access_token=" + document.getElementById("gitlab_key").value;
    }

    // Set or clear username
    await updateCurrUserName();

    await getProjectList(projFilter);

    $("#btnGetIssues").prop("disabled", true);
    setPhase("project_end");
  }

  return {
    getProjects: async function(projFilter) {
      await getProjects(projFilter);
    }
  };

})();
