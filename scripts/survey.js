var survey = (function () {
  let cookieList,
      surveyModel = new Survey.Model(surveyJSON);

  function hasCookie(name) {
    cookieList = {};
    document.cookie.split("; ").map(cookie => {
      cookieList[cookie.split("=")[0]] = (cookie.split("=")[1]);
    });

    return cookieList.hasOwnProperty(name);
  }

  function surveyInit() {
    if (hasCookie(surveyJSON.cookieName) || baseURL !== gitlabServers[0].baseURL) {
      return;
    }

    document.getElementById("survey-tab-item").classList.remove("d-none");

    Survey.StylesManager.applyTheme("bootstrap");

    function sendDataToServer(sendSurvey) {
      let url, data;

      url = baseURL + "projects/" + feedbackRepo + "/issues?" + gitlabKey;
      data = {
        title: `Survey for ${currUserName}`,
        description: JSON.stringify(sendSurvey.data),
        confidential: true
      };
      $.post(url, data, function(rData, status) {});

      document.getElementById("survey-tab-item").classList.add("d-none");
    }

    $("#surveyContainer").Survey({
        model: surveyModel,
        onComplete: sendDataToServer
    });
  }

  return {
    surveyInit: function() {
      surveyInit();
    }
  };

})();
