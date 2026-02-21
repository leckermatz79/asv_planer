/* =========================================
   G-CSF SCHEMAS
   Pure data – no logic
========================================= */

window.GCSF_SCHEMAS = {

  Pegfilgrastim: {
    type: "single",
    defaultDay: 2
  },

  Lipegfilgrastim: {
    type: "single",
    defaultDay: 2
  },

  Efbemalenograstim: {
    type: "single",
    defaultDay: 2
  },

  Filgrastim: {
    type: "multiple",
    days: [2, 3, 4, 5, 6]
  }

};