var startHours = 0;
var completedTasks = [];
var idealDaily;
var idealEffort = [];
var remainEffort = [];

function update_burndown_data() {
  startHours = 60;
  completedTasks = [0, 4, 3, 11, 7, 10, 3, 4, 8, 1, 1, 5, 0, 3];
  idealDaily = startHours / (completedTasks.length - 1);

  for (var i = 0; i < completedTasks.length; i++) {
    if(i != 0) {
      idealEffort.push(Math.max(0, Math.round((idealEffort[i - 1] - idealDaily) * 100) / 100))
      remainEffort.push(remainEffort[i - 1] - completedTasks[i])
    } else {
      idealEffort.push(startHours)
      remainEffort.push(startHours - completedTasks[i])
    }
  }

  $(function () {
    $("#burndown").highcharts({
      title: {text: "Project Burndown Chart"},
      xAxis: {
        title: {text: "Date"},
        categories: completedTasks.map((x,i) => i + 1 + " day"),
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
