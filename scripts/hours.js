var hours = (function () {
  let sprintHoursJSON = {};

  function updateData(selectedMilestone) {
    let milestoneIssues;

    sprintHoursJSON = {};
    milestoneIssues = milestoneList[selectedMilestone].issues;

    for (let i = 0; i < spentTimeList.length; i += 1) {
      if (milestoneIssues.includes(spentTimeList[i].issue)) {
        sprintHoursJSON[spentTimeList[i].author] = sprintHoursJSON[spentTimeList[i].author] || {assigned: "?", completed: 0};
        sprintHoursJSON[spentTimeList[i].author].completed += spentTimeList[i].spent;
      }
    }

  }

  function loadHoursTable() {
    let sprintHoursArr = [];

    // TODO Fix this Arr to JSON - This is a messy way of setting data for DataTable
    for (let person in sprintHoursJSON) {
      if (sprintHoursJSON.hasOwnProperty(person)) {
        sprintHoursArr.push({author: person, assigned: sprintHoursJSON[person].assigned, completed: sprintHoursJSON[person].completed});
      }
    }

    // Reset table
    if ( $.fn.dataTable.isDataTable( "#hourstable" ) ) {
      $("#hourstable").dataTable().fnDestroy();
      $("#hourstablerows tr").remove();
    }

    $("#hourstable").DataTable({
      responsive: true,
      data: sprintHoursArr,
      columns: [
        {title: "Team member", data: "author"},
        {title: "Hr Assigned", data: "assigned"},
        {title: "Hr Completed", data: "completed"},
        {title: "Percent Complete"}
      ],
      columnDefs: [{
        render: function ( data, type, row ) {
          // return Math.round((row.completed / row.assigned) * PERCENT) + "%";
          return "Coming Soon";
        },
        targets: 3
      }]
    });
  }

  function updateHoursData(selectedMilestone) {
    updateData(selectedMilestone);
    loadHoursTable();
  }

return {
  updateHoursData: async function(selectedMilestone) {
    updateHoursData(selectedMilestone);

    return;
  }
};

})();
