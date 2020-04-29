var surveyJSON = {
  "cookieName": "2019futureSurvey",
 "pages": [
  {
   "name": "page1",
   "elements": [
    {
     "type": "html",
     "name": "survey",
     "html": "<h2>Thank You</h2>\n<p>Thank you for taking the time to provide your feedback on this tool.  Your feedback will help set the future direction of the site.</p>"
    },
    {
     "type": "panel",
     "name": "panel1",
     "elements": [
      {
       "type": "rating",
       "name": "rank_design",
       "title": "Design of the website"
      },
      {
       "type": "text",
       "name": "text_design",
       "visibleIf": "{rank_design} <= 3",
       "title": "What would make the design better?"
      },
      {
       "type": "rating",
       "name": "rank_issue",
       "title": "The usefulness of the Issue List"
      },
      {
       "type": "text",
       "name": "text_issue",
       "visibleIf": "{rank_issue} <= 3",
       "title": "What would make the issue list better?"
      },
      {
       "type": "rating",
       "name": "rank_burndown",
       "title": "The usefulness of the Burndown Chart"
      },
      {
       "type": "text",
       "name": "text_burndown",
       "visibleIf": "{rank_burndown} <= 3",
       "title": "What would make the burndown chart better?"
      }
     ],
     "title": "How would you rate the scrum tool based on:"
    }
   ]
  },
  {
   "name": "page2",
   "elements": [
    {
     "type": "panel",
     "name": "panel2",
     "elements": [
      {
       "type": "html",
       "name": "futureOutline",
       "html": "  <h2>The Future</h2>\n\n    <p>In 2020, the website will be developed into a one-stop Scrum tool.  Several features will be added such as</p>\n    <ul>\n      <li>Managing Spent and Estimated time within the tool</li>\n      <li>Combinging several sprints into a release (aka Epic)</li>\n      <li>Managing User Stories that span several sprints</li>\n      <li>A more detailed breakdown of member information: Hours Assigned, Hours Completed and Percentage of assigned work completed</li>\n    </ul>"
      },
      {
       "type": "dropdown",
       "name": "prio_1",
       "title": "What is your top priority?",
       "isRequired": true,
       "hasOther": true,
       "choices": [
        {
         "value": "time",
         "text": "Managing Spent and Estimated time within the tool"
        },
        {
         "value": "epic",
         "text": "Combining several sprints into a release (aka Epic)"
        },
        {
         "value": "tasks",
         "text": "Managing User Stories that span several sprints"
        },
        {
         "value": "users",
         "text": "A more detailed breakdown of member information: Hours Assigned, Hours Completed and Percentage of assigned work completed"
        }
       ]
      },
      {
       "type": "dropdown",
       "name": "prio_2a",
       "visibleIf": "{prio_1} = \"time\"",
       "title": "What is your second priority?",
       "isRequired": true,
       "hasOther": true,
       "choices": [
        {
         "value": "epic",
         "text": "Combining several sprints into a release (aka Epic)"
        },
        {
         "value": "tasks",
         "text": "Managing User Stories that span several sprints"
        },
        {
         "value": "users",
         "text": "A more detailed breakdown of member information: Hours Assigned, Hours Completed and Percentage of assigned work completed"
        }
       ]
      },
      {
       "type": "dropdown",
       "name": "prio_2b",
       "visibleIf": "{prio_1} = \"epic\"",
       "title": "What is your second priority?",
       "isRequired": true,
       "hasOther": true,
       "choices": [
        {
         "value": "time",
         "text": "Managing Spent and Estimated time within the tool"
        },
        {
         "value": "tasks",
         "text": "Managing User Stories that span several sprints"
        },
        {
         "value": "users",
         "text": "A more detailed breakdown of member information: Hours Assigned, Hours Completed and Percentage of assigned work completed"
        }
       ]
      },
      {
       "type": "dropdown",
       "name": "prio_2c",
       "visibleIf": "{prio_1} = \"tasks\"",
       "title": "What is your second priority?",
       "isRequired": true,
       "hasOther": true,
       "choices": [
        {
         "value": "time",
         "text": "Managing Spent and Estimated time within the tool"
        },
        {
         "value": "epic",
         "text": "Combining several sprints into a release (aka Epic)"
        },
        {
         "value": "users",
         "text": "A more detailed breakdown of member information: Hours Assigned, Hours Completed and Percentage of assigned work completed"
        }
       ]
      },
      {
       "type": "dropdown",
       "name": "prio_2d",
       "visibleIf": "{prio_1} = \"users\"",
       "title": "What is your second priority?",
       "isRequired": true,
       "hasOther": true,
       "choices": [
        {
         "value": "time",
         "text": "Managing Spent and Estimated time within the tool"
        },
        {
         "value": "epic",
         "text": "Combining several sprints into a release (aka Epic)"
        },
        {
         "value": "tasks",
         "text": "Managing User Stories that span several sprints"
        }
       ]
      },
      {
       "type": "dropdown",
       "name": "prio_2e",
       "visibleIf": "{prio_1} = \"other\"",
       "title": "What is your second priority?",
       "isRequired": true,
       "hasOther": true,
       "choices": [
        {
         "value": "time",
         "text": "Managing Spent and Estimated time within the tool"
        },
        {
         "value": "epic",
         "text": "Combining several sprints into a release (aka Epic)"
        },
        {
         "value": "tasks",
         "text": "Managing User Stories that span several sprints"
        },
        {
         "value": "users",
         "text": "A more detailed breakdown of member information: Hours Assigned, Hours Completed and Percentage of assigned work completed"
        }
       ]
      }
     ]
    }
   ]
  },
  {
   "name": "page3",
   "elements": [
     {
     "type": "html",
     "name": "question2",
     "html": "<h2>Final Thoughts?</h2>"
    },
    {
     "type": "text",
     "name": "annoying",
     "title": "What part(s) of the tool do you find annoying?"
    },
    {
     "type": "text",
     "name": "helpful",
     "title": "What part(s) of the tool do you find the most helpful?"
    },
    {
     "type": "text",
     "name": "wish",
     "title": "What else do you wish the website would do?"
    },
    {
      "type": "boolean",
      "name": "isContact",
      "title": "Would you like to be involved the next version of the tool?  This could be as easy as a quick interview after the semester ends or as involved as testing and informing the direction of the new website. (Note: toggle is buggy on some browsers, make sure your selection is correct.)",
      "labelTrue": "Yes",
      "labelFalse": "No"
    },
    {
     "type": "text",
     "name": "contact",
     "visibleIf": "{isContact} = true",
     "title": "Please enter your email address (an address you will check during the summer semester).  This email address will not be made public."
    }
   ]
  }
 ],
 "showPageTitles": false,
 "showQuestionNumbers": "off"
}
