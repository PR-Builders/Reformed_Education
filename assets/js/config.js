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
    version: "202609292350",   // stamped by tools/bump_version.py; appended to data requests to avoid stale caches
    siteName: "Reformed Education",
    tagline: "Reformed education and resources, in one place.",
    latinTagline: "Quaere et Disce",
    latinTranslation: "Seek and learn",
    dataPath: "data/",
    PLACEHOLDER,

    nav: [
      { label: "Education", href: "education.html", key: "education" },
      { label: "Seminaries", href: "seminaries.html", key: "seminaries" },
      { label: "Colleges", href: "colleges.html", key: "colleges" },
      { label: "Schools", href: "schools.html", key: "schools" },
      { label: "Courses", href: "courses.html", key: "courses" },
      { label: "Catechisms", href: "catechisms.html", key: "catechisms" },
      { label: "Library", href: "library.html", keys: ["library", "publishers", "authors", "podcasts", "lectures", "resources"] },
      { label: "Family", href: "family.html", key: "family" },
      { label: "Officers", href: "officers.html", key: "officers" },
      { label: "Quizzes", href: "quizzes.html", key: "quizzes" },
    ],

    /* Directory collections. `file` is the JSON file in /data; `fields` drive the detail page;
       `filters` are keys that become dropdown facets on the list page. */
    collections: {
      seminaries: {
        file: "seminaries.json", label: "Seminaries", singular: "Seminary", page: "seminaries.html",
        intro: "Theological seminaries and graduate schools of theology with a Reformed or confessional identity.",
        cardMeta: ["location", "tradition"], filters: ["tradition", "delivery", "degrees"],
        fields: [
          { key: "location", label: "Location" },
          { key: "tradition", label: "Tradition" },
          { key: "affiliation", label: "Denomination / Affiliation" },
          { key: "degrees", label: "Degrees", type: "list" },
          { key: "delivery", label: "Delivery", type: "list" },
          { key: "accreditation", label: "Accreditation" },
          { key: "tuition", label: "Tuition" },
          { key: "website", label: "Website", type: "url" },
          { key: "admissions_url", label: "Admissions", type: "url" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
      colleges: {
        file: "colleges.json", label: "Colleges", singular: "College", page: "colleges.html",
        intro: "Undergraduate colleges and universities with a Reformed or confessional emphasis.",
        cardMeta: ["location", "tradition"], filters: [],
        fields: commonInstitution.concat([{ key: "description", label: "Description", type: "text" }]),
      },
      schools: {
        file: "schools.json", label: "Christian Schools", singular: "Christian School", page: "schools.html",
        intro: "Classical, covenantal and confessional Christian schools for children and families.",
        cardMeta: ["org_type", "location"], filters: ["emphasis", "org_type"],
        fields: [
          { key: "org_type", label: "Type" },
          { key: "emphasis", label: "Emphasis" },
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
        cardMeta: ["kind", "creator"], filters: ["kind"],
        fields: [
          { key: "kind", label: "Type" },
          { key: "creator", label: "Author / Creator" },
          { key: "subject", label: "Subject" },
          { key: "audience", label: "Audience" },
          { key: "website", label: "Website", type: "url" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
      publishers: {
        file: "publishers.json", label: "Publishers", singular: "Publisher", page: "publishers.html",
        intro: "Publishers of Reformed books, curricula and study materials. Start with the publisher, then find the books.",
        cardMeta: ["location"], filters: [],
        fields: [{ key: "location", label: "Location" }, { key: "tradition", label: "Tradition" }, { key: "website", label: "Website", type: "url" }, { key: "description", label: "Description", type: "text" }],
      },
      authors: {
        file: "authors.json", label: "Authors", singular: "Author", page: "authors.html",
        intro: "Reformed theologians and writers. Each profile will eventually gather an author's books, courses, lectures and articles.",
        cardMeta: ["dates", "tradition"], filters: [],
        fields: [{ key: "dates", label: "Lived" }, { key: "tradition", label: "Tradition" }, { key: "works", label: "Principal Works", type: "list" }, { key: "website", label: "Website", type: "url" }, { key: "description", label: "Description", type: "text" }],
      },
      podcasts: {
        file: "podcasts.json", label: "Podcasts & Audio", singular: "Podcast", page: "podcasts.html",
        intro: "Podcasts and audio programs on Reformed theology, church life and history.",
        cardMeta: ["creator"], filters: ["subject"],
        fields: [{ key: "creator", label: "Host / Producer" }, { key: "organization", label: "Organization" }, { key: "subject", label: "Subjects", type: "list" }, { key: "website", label: "Website", type: "url" }, { key: "description", label: "Description", type: "text" }],
      },
      lectures: {
        file: "lectures.json", label: "Lectures & Video", singular: "Lecture Provider", page: "lectures.html",
        intro: "Lecture series and video teaching from seminaries and ministries.",
        cardMeta: ["provider"], filters: ["subject"],
        fields: [{ key: "provider", label: "Provider" }, { key: "subject", label: "Subjects", type: "list" }, { key: "website", label: "Website", type: "url" }, { key: "description", label: "Description", type: "text" }],
      },
      family: {
        file: "family.json", label: "Family & Children's Education", singular: "Family Resource", page: "family.html",
        intro: "Catechisms, curricula, family worship and other resources for parents and children.",
        cardMeta: ["kind", "provider"], filters: ["kind"],
        fields: [{ key: "kind", label: "Type" }, { key: "provider", label: "Provider" }, { key: "audience", label: "Audience" }, { key: "website", label: "Website", type: "url" }, { key: "description", label: "Description", type: "text" }],
      },
      officers: {
        file: "officers.json", label: "Church Officer Education", singular: "Officer Training", page: "officers.html",
        intro: "Training and resources for elders, deacons and pastors.",
        cardMeta: ["office"], filters: ["office"],
        fields: [{ key: "office", label: "Office", type: "list" }, { key: "provider", label: "Provider / Denomination" }, { key: "website", label: "Website", type: "url" }, { key: "description", label: "Description", type: "text" }],
      },
      catechisms: {
        file: "catechisms.json", label: "Catechisms", singular: "Catechism", page: "catechisms.html",
        intro: "Catechisms and confessions, with tools for study and memorization.",
        cardMeta: ["kind"], filters: [], detailPage: "catechism.html",
        fields: [],
      },
    },

    /* Top-level categories shown as large cards on the home and Education pages. */
    categories: [
      { key: "seminaries", numeral: "I", label: "Seminaries", href: "seminaries.html", blurb: "Theological institutions that train pastors, teachers and scholars." },
      { key: "colleges", numeral: "II", label: "Colleges", href: "colleges.html", blurb: "Undergraduate education with a confessional Reformed emphasis." },
      { key: "schools", numeral: "III", label: "Christian Schools", href: "schools.html", blurb: "Schools and school networks, distinguished by confessional emphasis." },
      { key: "courses", numeral: "IV", label: "Online Courses", href: "courses.html", blurb: "Study Reformed theology and church history from anywhere." },
      { key: "catechisms", numeral: "V", label: "Catechisms", href: "catechisms.html", blurb: "Confessions, catechisms and creeds, with study tools." },
      { key: "library", numeral: "VI", label: "Library", href: "library.html", blurb: "Publishers, authors, podcasts, lectures and educational resources." },
      { key: "family", numeral: "VII", label: "Family & Children", href: "family.html", blurb: "Resources for parents: catechisms, curricula and family worship." },
      { key: "officers", numeral: "VIII", label: "Church Officer Education", href: "officers.html", blurb: "Training for elders, deacons and pastors." },
      { key: "quizzes", numeral: "IX", label: "Quizzes", href: "quizzes.html", blurb: "Test your knowledge of Scripture, doctrine and church history." },
    ],

    /* "Where can I…?" pathways for the home and Education pages. */
    pathways: [
      { q: "Where can I study Reformed theology?", links: [["Seminaries", "seminaries.html"], ["Colleges", "colleges.html"], ["Online Courses", "courses.html"]] },
      { q: "What Reformed seminaries and colleges exist?", links: [["Seminaries", "seminaries.html"], ["Colleges", "colleges.html"]] },
      { q: "What Christian schools have a confessional emphasis?", links: [["Christian Schools", "schools.html"]] },
      { q: "Where can I learn the Westminster Shorter Catechism?", links: [["Browse the catechism", "catechism.html?id=wsc"], ["Flashcards", "catechism.html?id=wsc&mode=flashcards"], ["Memorize", "catechism.html?id=wsc&mode=memorize"]] },
      { q: "What resources are there for children and families?", links: [["Family & Children", "family.html"], ["Educational Resources", "resources.html"], ["Christian Schools", "schools.html"]] },
      { q: "What books, lectures and podcasts are available?", links: [["Publishers", "publishers.html"], ["Podcasts", "podcasts.html"], ["Lectures", "lectures.html"]] },
      { q: "Which authors should I read?", links: [["Authors", "authors.html"], ["Publishers", "publishers.html"]] },
      { q: "How do I prepare to serve as an elder, deacon or pastor?", links: [["Church Officer Education", "officers.html"]] },
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
