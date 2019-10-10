var base_url;
var gitlab_key;
var project_id;

function getProjects() {
  // Get and set variables
  base_url = document.getElementById("base_url").value;
  gitlab_key = document.getElementById("gitlab_key").value;

  var url = base_url + "projects?private_token=" + gitlab_key

  let dropdown = $('#project-dropdown');
  dropdown.empty();
  dropdown.append('<option selected="true" disabled>Choose Project</option>');
  dropdown.prop('selectedIndex', 0);

  $.getJSON(url, function (data) {
    $.each(data, function (key, entry) {
      dropdown.append($('<option></option>').attr('value', entry.id).text(entry.name));
    })
  });

  // Unhide next section
  document.getElementById("gitlab_get_project").style.display = "block";
}

function getIssues() {
  // Unhide next section
  document.getElementById("gitlab_show_issues").style.display = "block";

  // Get and set variables
  project_id = document.getElementById("project-dropdown").value;
  console.log(project_id)
  var url = base_url + "projects/" + project_id + "/issues?private_token=" + gitlab_key

  // Reset table
  $(".issueTable tr").remove();

  // Get Data
  $.getJSON(url, function(data) {
    for (var i = 0; i < data.length; i++) {
        tr = $('<tr/>');
        tr.append("<td>" + data[i].title + "</td>");
        tr.append("<td>" + data[i].state + "</td>");
        tr.append("<td>" + data[i].time_stats.human_time_estimate + "</td>");
        $('.issueTable').append(tr);
    }
  });
}

$( document ).ready(function() {
  // Hide other sections
  document.getElementById("gitlab_get_project").style.display = "none";
  document.getElementById("gitlab_show_issues").style.display = "none";
});
