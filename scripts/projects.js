var projects = (function () {

  async function getProjectList(projFilter) {
    let url, projectPages, dropdown;

    // Build URL and get project list
    if (projFilter === "all" || currUserName === null) {
      url = baseURL + "projects?order_by=name&sort=asc&simple=true&private_token=" + gitlabKey;
    } else {
      url = baseURL + "projects?order_by=name&min_access_level=40&sort=asc&simple=true&private_token=" + gitlabKey;
    }

    projectList = [];

    // Get number of project pages
    projectPages = getHeaderValue(url, "x-total-pages");

    // Set up drowndown
    dropdown = $("#project-dropdown");
    dropdown.empty();
    dropdown.append("<option selected='true' disabled>Choose Project</option>");
    dropdown.prop("selectedIndex", 0);

    // Fill dropdown
    console.log("Obtaining data at: " + url + "&page=1 of " + projectPages + " page(s)");

    for (let i = 1; i <= projectPages; i += 1) {
      await $.getJSON(url + "&page=" + i, function (data) {
        // TODO Alphabetize project list THEN make option list
        projectList = projectList.concat(data);
        $.each(data, function (key, entry) {
          let projName;

          if (currUserName === null || currUserName.length === 0 || currUserName !== entry.namespace.path) {
            projName = entry.name + " (" + entry.namespace.path + ")";
          } else {
            projName = entry.name;
          }
          dropdown.append($("<option></option>").attr("value", entry.id).text(projName));
        });
      });
    }

  }

  async function getProjects(projFilter) {
    setPhase("project_start");

    // Get and set variables
    baseURL = document.getElementById("base_url").value;
    gitlabKey = document.getElementById("gitlab_key").value;

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
