/* Site-wide configuration. Adding a new directory collection = one block in `collections`
   plus one JSON file in /data. Nothing else needs to change. */
(function () {
  const RE = (window.RE = window.RE || {});
  RE.pages = {};

  const PLACEHOLDER = "[Placeholder — information to be added]";

  const commonInstitution = [
    { key: "location", label: "Location" },
    { key: "tradition", label: "Tradition" },
    { key: "affiliation", label: "Denomination / Affiliation" },
    { key: "degree_programs", label: "Degree Programs", type: "list" },
    { key: "online_programs", label: "Online Programs" },
    { key: "residential_programs", label: "Residential Programs" },
    { key: "accreditation", label: "Accreditation" },
    { key: "tuition", label: "Tuition" },
    { key: "website", label: "Website", type: "url" },
    { key: "admissions_url", label: "Admissions", type: "url" },
  ];

  RE.config = {
    siteName: "Reformed Education",
    tagline: "Reformed education and resources, in one place.",
    dataPath: "data/",
    PLACEHOLDER,

    nav: [
      { label: "Education", href: "education.html", key: "education" },
      { label: "Seminaries", href: "seminaries.html", key: "seminaries" },
      { label: "Colleges", href: "colleges.html", key: "colleges" },
      { label: "Schools", href: "schools.html", key: "schools" },
      { label: "Courses", href: "courses.html", key: "courses" },
      { label: "Catechisms", href: "catechisms.html", key: "catechisms" },
      { label: "Resources", href: "resources.html", key: "resources" },
      { label: "Quizzes", href: "quizzes.html", key: "quizzes" },
    ],

    /* Directory collections. `file` is the JSON file in /data; `fields` drive the detail page;
       `filters` are keys that become dropdown facets on the list page. */
    collections: {
      seminaries: {
        file: "seminaries.json", label: "Seminaries", singular: "Seminary", page: "seminaries.html",
        intro: "Theological seminaries and graduate schools of theology with a Reformed or confessional identity.",
        cardMeta: ["location", "tradition"], filters: ["tradition"],
        fields: commonInstitution.concat([{ key: "description", label: "Description", type: "text" }]),
      },
      colleges: {
        file: "colleges.json", label: "Colleges", singular: "College", page: "colleges.html",
        intro: "Undergraduate colleges and universities with a Reformed or confessional emphasis.",
        cardMeta: ["location", "tradition"], filters: ["tradition"],
        fields: commonInstitution.concat([{ key: "description", label: "Description", type: "text" }]),
      },
      schools: {
        file: "schools.json", label: "Christian Schools", singular: "Christian School", page: "schools.html",
        intro: "Classical, covenantal and confessional Christian schools for children and families.",
        cardMeta: ["location", "grades"], filters: ["tradition"],
        fields: [
          { key: "location", label: "Location" },
          { key: "grades", label: "Grades Served" },
          { key: "tradition", label: "Tradition" },
          { key: "affiliation", label: "Denomination / Affiliation" },
          { key: "accreditation", label: "Accreditation" },
          { key: "tuition", label: "Tuition" },
          { key: "website", label: "Website", type: "url" },
          { key: "admissions_url", label: "Admissions", type: "url" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
      courses: {
        file: "courses.json", label: "Online Courses", singular: "Course", page: "courses.html",
        intro: "Courses in Reformed theology, church history, Scripture and related subjects.",
        cardMeta: ["provider", "format"], filters: ["format", "level"],
        fields: [
          { key: "provider", label: "Provider" },
          { key: "instructor", label: "Instructor" },
          { key: "format", label: "Format" },
          { key: "level", label: "Level" },
          { key: "subject", label: "Subject" },
          { key: "cost", label: "Cost" },
          { key: "website", label: "Website", type: "url" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
      resources: {
        file: "resources.json", label: "Educational Resources", singular: "Resource", page: "resources.html",
        intro: "Books, lectures, podcasts, study guides, games and other Reformed educational resources.",
        cardMeta: ["kind", "creator"], filters: ["kind", "audience"],
        fields: [
          { key: "kind", label: "Type" },
          { key: "creator", label: "Author / Creator" },
          { key: "subject", label: "Subject" },
          { key: "audience", label: "Audience" },
          { key: "website", label: "Website", type: "url" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
      catechisms: {
        file: "catechisms.json", label: "Catechisms", singular: "Catechism", page: "catechisms.html",
        intro: "Catechisms and confessions, with tools for study and memorization.",
        cardMeta: [], filters: [], detailPage: "catechism.html",
        fields: [],
      },
    },

    /* Top-level categories shown as large cards on the home and Education pages. */
    categories: [
      { key: "seminaries", numeral: "I", label: "Seminaries", href: "seminaries.html", blurb: "Theological institutions that train pastors, teachers and scholars." },
      { key: "colleges", numeral: "II", label: "Colleges", href: "colleges.html", blurb: "Undergraduate education with a confessional Reformed emphasis." },
      { key: "schools", numeral: "III", label: "Christian Schools", href: "schools.html", blurb: "Primary and secondary schools for Reformed families." },
      { key: "courses", numeral: "IV", label: "Online Courses", href: "courses.html", blurb: "Study Reformed theology and church history from anywhere." },
      { key: "catechisms", numeral: "V", label: "Catechisms", href: "catechisms.html", blurb: "Browse, memorize and be quizzed on the catechisms." },
      { key: "resources", numeral: "VI", label: "Educational Resources", href: "resources.html", blurb: "Books, lectures, podcasts, games and family resources." },
      { key: "quizzes", numeral: "VII", label: "Quizzes", href: "quizzes.html", blurb: "Test your knowledge of Scripture, doctrine and church history." },
    ],

    /* "Where can I…?" pathways for the home and Education pages. */
    pathways: [
      { q: "Where can I study Reformed theology?", links: [["Seminaries", "seminaries.html"], ["Colleges", "colleges.html"], ["Online Courses", "courses.html"]] },
      { q: "What Reformed seminaries and colleges exist?", links: [["Seminaries", "seminaries.html"], ["Colleges", "colleges.html"]] },
      { q: "What Christian schools have a confessional emphasis?", links: [["Christian Schools", "schools.html"]] },
      { q: "Where can I learn the Westminster Shorter Catechism?", links: [["Browse the catechism", "catechism.html?id=wsc"], ["Flashcards", "catechism.html?id=wsc&mode=flashcards"], ["Memorize", "catechism.html?id=wsc&mode=memorize"]] },
      { q: "What resources are there for children and families?", links: [["Educational Resources", "resources.html"], ["Christian Schools", "schools.html"]] },
      { q: "What books, lectures and podcasts are available?", links: [["Educational Resources", "resources.html"], ["Online Courses", "courses.html"]] },
    ],

    /* Citation style — one consistent set of fields for every source on the site.
       Entry data: { source: { title, author, organization, url, date, edition, translation,
       copyright_status, copyright, license, notes } }. Missing copyright/notes fall back to `citationDefaults`. */
    citationDefaults: {
      copyright: "Copyright retained by original publisher.",
      notes: "Resource indexed for educational and directory purposes.",
    },
    copyrightStatuses: {
      retained: "Copyright retained",
      "public-domain": "Public domain",
      licensed: "Open license",
      unknown: "Status to be confirmed",
    },

    /* URL of the page that shows one entry. */
    urlFor(type, entry) {
      const c = RE.config.collections[type];
      if (c && c.detailPage) return `${c.detailPage}?id=${encodeURIComponent(entry.id)}`;
      return `entry.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(entry.id)}`;
    },
  };
})();
