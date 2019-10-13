var startHours = 0;
var startDate;
var endDate;
var completedTasks = [];
var idealDaily;
var spent_time_list = []
var spentEffort = [];
var idealEffort = [];
var remainEffort = [];
var issue_notes_list = [];
var convertTable = {
  mo: 160,
  w : 40,
  d : 8,
  h : 1,
  m : 1.0 / 60.0
}

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
  startDate = issue_list[0].created_at;
  endDate = issue_list[0].updated_at;

  // Get data from issues
  for (var issue in issue_list) {
    // Accumlate hours
    startHours += issue_list[issue].time_stats.time_estimate / 3600;
    // Update dates
    if (startDate > issue_list[issue].created_at) startDate = issue_list[issue].created_at;
    if (endDate < issue_list[issue].updated_at) endDate = issue_list[issue].updated_at;

    // Get Notes
    let issue_iid = issue_list[issue].iid
    url = base_url + "projects/" + project_id + "/issues/" + issue_iid + "/notes?private_token=" + gitlab_key;
    await get_issue_notes(url);
  }
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  // Go through notes to get changes in spend
  let note_re = /(added|subtracted) (.*) of time spent at (.*)-(.*)-(.*)/;
  issue_notes_list.forEach(function(note) {
    let body = note.body
    let match = body.match(note_re)

    // If time spent was changed
    if (match != null) {
      // parse spent
      time = match[2].match(/([0-9]*)([a-zA-Z]*)/)
      spent = time[1] * convertTable[time[2]]
      // update if subtracted
      if (match[1] == "subtracted") spent = spent * -1;
      // parse date
      date = Date.UTC(parseInt(match[3]), parseInt(match[4])-1, parseInt(match[5]))
      spent_time_list.push({date: date, spent: spent, issue: note.noteable_iid, author: note.author.name})
    }
  });

  // Create Cummulative lines
  let dayDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  idealDaily = startHours / dayDiff;

  idealEffort = [];
  remainEffort = [];
  idealEffort.push([new Date(startDate.toDateString()).getTime(), startHours])
  remainEffort.push([new Date(startDate.toDateString()).getTime(), startHours])
  for (var i = 0; i <= dayDiff; i++) {
  	let effort = Math.max(0, Math.round((startHours - (idealDaily * i)) * 100) / 100)
    let eff_day = idealEffort[0][0] + (60*60*24*1000*i);
  	idealEffort.push([eff_day, effort])
  }
  idealEffort.shift();
}

function json_to_series(json, xlabel, ylabel) {
  // Reduce json
  let series = Object.values(json.reduce((acc, cur) => {
    acc[cur[xlabel]] = acc[cur[xlabel]] || {x: cur[xlabel], y : 0};
    acc[cur[xlabel]].y += +cur[ylabel];
    return acc;
  },{}));

  // Sort by x axis
  series = series.sort(function(a, b) {
    return parseFloat(a.x) - parseFloat(b.x);
  });

  return series
}

async function update_burndown_data() {
  await get_data()

  $(function () {
    $("#burndown").highcharts({
      title: {text: "Project Burndown Chart"},
      xAxis: {
        type: 'datetime',
        title: {text: "Date"},
        // tickInterval: 86400000,
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
        data: json_to_series(spent_time_list, "date", "spent")
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
