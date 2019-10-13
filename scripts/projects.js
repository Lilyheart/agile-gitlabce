async function get_project_list(url) {
  console.log(url)
  project_list = [];
  url = url + "projects?order_by=name&sort=asc&simple=true&private_token=" + gitlab_key

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
      // TODO Alphabetize project list THEN make option list
      project_list = project_list.concat(data)
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
    url = base_url;
  } else {
    url = base_url + "users/" + curr_username + "/";
  }

  await get_project_list(url)

  $('#btnGetIssues').prop('disabled', true);
  set_phase("project_end")
}
