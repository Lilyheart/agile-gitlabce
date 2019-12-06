var surveyJSON = {
 "pages": [
  {
   "name": "page1",
   "elements": [
    {
     "type": "html",
     "name": "Thanks for shopping with Waves Inc. We'd love to know a bit more about your experience with us."
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
       "name": "question1",
       "html": "  <h2>The Future</h2>\n\n    <p>In 2020, the website will be developed into a one-stop Scrum tool.  Several features will be added such as</p>\n    <ul>\n      <li>Managing Spent and Estimated time within the tool</li>\n      <li>Combinging several sprints into a release (aka Epic)</li>\n      <li>Managing User Stories that span several sprints</li>\n      <li>A more detailed breakdown of member information: Hours Assigned, Hours Completed and Percentage of assigned work completed</li>\n    </ul>"
      },
      {
       "type": "dropdown",
       "name": "prio_1",
       "title": "What is your top priority?",
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
     "type": "text",
     "name": "question2",
     "title": "What part(s) of the tool do you find annoying?"
    },
    {
     "type": "text",
     "name": "question4",
     "title": "What part(s) of the tool do you find the most helpful?"
    },
    {
     "type": "text",
     "name": "question3",
     "title": "What else do you wish the website would do?"
    }
   ]
  }
 ],
 "cookieName": "agilesurvey",
 "showPageTitles": false,
 "showQuestionNumbers": "off"
}
