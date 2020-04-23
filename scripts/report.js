var report = (function () {

  function loadSprintCharts() {
  console.log(Object.values(milestoneList));
  // Loop thru milestone list
    // If no issues, print message
    // If issues, display chart

  }

  function loadProjectChart() {

  }

  async function loadReport() {
    document.getElementById("project_report").classList.remove("d-none");

    loadSprintCharts();
    loadProjectChart();
  }

  return {
    loadReport: async function(issue, errorMessage) {
      await loadReport();
    }
  };
})();
