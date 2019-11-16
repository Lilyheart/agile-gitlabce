var projects = (function () {

  function urlExists(url, callback) {
    fetch(url, {method: "head"})
    .then(function(status) {
      callback(status.ok);
    });
  }

  async function getProjectList(projFilter) {
    let url, projectPages;

    // Build URL and get project list
    if (projFilter === "all" || currUserName === null) {
      url = baseURL + "projects?order_by=name&sort=asc&simple=true&" + gitlabKey;
    } else {
      url = baseURL + "projects?order_by=name&min_access_level=40&sort=asc&simple=true&" + gitlabKey;
    }

    projectList = [];

    // Get number of project pages
    projectPages = getHeaderValue(url, "x-total-pages");


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

    // Is this a bookmarked project?
    if (searchDict.hasOwnProperty("project") && searchDict.project.length > 0) {
      // Attempt to set dropdown
      $("#project-dropdown").selectize()[0].selectize.setValue(searchDict.project, false);

      // handle if issue is not in dropdown
      if ($("#project-dropdown").selectize()[0].selectize.getValue() !== searchDict.project) {
        url = baseURL + "projects/" + searchDict.project + "?" + gitlabKey;

        urlExists(url, async function(exists) {
          let projName;

          if (exists) {
            await $.getJSON(url, function (data) {
              projectData = projectData.concat(data);
            });

            if (projectData[0].namespace.path === currUserName) {
              projectData[0].dropdownText = projectData[0].name;
            } else {
              projectData[0].dropdownText = projectData[0].name + "(" + projectData[0].namespace.path + ")";
            }

            projectList.push(projectData[0]);

            $("#project-dropdown").selectize()[0].selectize.destroy();
            $("#project-dropdown").selectize({
              valueField: "id",
              labelField: "dropdownText",
              searchField: "dropdownText",
              options: projectList,
              create: false
            });
            $("#project-dropdown").selectize()[0].selectize.setValue(searchDict.project, false);

            issues.getIssues();
          } else {
            $("#gitlab_get_project").prepend("<div class='alert alert-warning mt-3'><a class='close' data-dismiss='alert'>×</a><span>Bookmarked project not found</span></div>");
          }
        });
      } else {
        issues.getIssues();
      }
    }
  }

  return {
    getProjects: async function(projFilter) {
      await getProjects(projFilter);
    }
  };

})();
