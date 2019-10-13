var startHours = 0;
var completedTasks = [];
var idealDaily;
var idealEffort = [];
var remainEffort = [];
var issue_notes_list = [];

async function get_issue_notes(url) {
  // Get number of project pages
  projectPages = get_header_value(url, "x-total-pages")

  // Get Data
  console.log("Obtaining data at: " + url + "&page=1 of " + projectPages + " page(s)")
  for(i=1; i <= projectPages; i++) {
    await $.getJSON(url + "&page=" + i, function(data) {
      issue_notes_list = issue_notes_list.concat(data)
    });
  }
}

async function get_data() {
  issue_notes_list = [];

  // Get data from issues
  for (var issue in issue_list) {
    startHours += issue_list[issue].time_stats.time_estimate / 3600;

    let issue_iid = issue_list[issue].iid
    url = base_url + "projects/" + project_id + "/issues/" + issue_iid + "/notes?private_token=" + gitlab_key;

    await get_issue_notes(url);
  }

}

async function update_burndown_data() {
  await get_data()

  $(function () {
    $("#burndown").highcharts({
      title: {text: "Project Burndown Chart"},
      xAxis: {
        type: 'datetime',
        title: {text: "Date"},
        tickInterval: 86400000,
        labels: {
          format: '{value:%m/%d/%Y}',
          rotation: -30
        }
      },
      yAxis: {
        title: {text: "Hours"},
      },
      tooltip: {
        valueSuffix: " hrs",
      },
      legend: {
        layout: "vertical",
        align: "right",
        verticalAlign: "middle",
        borderWidth: 1
      },
      series: [{
        type: "column",
        name: "Completed Tasks",
        color: "#4682b4",
        data: completedTasks
      }, {
        name: "Ideal Burndown",
        color: "rgba(255,0,0,0.75)",
        marker: {
          enabled: false
        },
        lineWidth: 2,
        data: idealEffort
      }, {
        type: "spline",
        name: "Remaining Effort",
        color: "rgba(0, 100, 0, 0.75)",
        marker: {
          radius: 6
        },
        lineWidth: 2,
        data: remainEffort
      }]
    });
  });
}
