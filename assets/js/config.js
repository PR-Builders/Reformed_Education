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
    version: "202609300317",   // stamped by tools/bump_version.py; appended to data requests to avoid stale caches
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
        intro: "Theological seminaries and graduate schools of theology: confessional Reformed and Presbyterian seminaries first, then conservative and broader evangelical alternatives, and PC(USA) seminaries flagged so they are not mistaken for PCA- or OPC-aligned schools.",
        cardMeta: ["location", "doctrinal_posture"], filters: ["doctrinal_posture", "tradition", "delivery", "degrees"],
        groupBy: "doctrinal_posture",
        fields: [
          { key: "doctrinal_posture", label: "Theological posture" },
          { key: "location", label: "Location" },
          { key: "founded", label: "Founded" },
          { key: "tradition", label: "Tradition" },
          { key: "affiliation", label: "Denomination / Affiliation" },
          { key: "doctrinal_basis", label: "Doctrinal basis" },
          { key: "points_to_weigh", label: "Points to weigh", type: "list" },
          { key: "degrees", label: "Degrees", type: "list" },
          { key: "delivery", label: "Delivery", type: "list" },
          { key: "accreditation", label: "Accreditation" },
          { key: "tuition", label: "Tuition" },
          { key: "website", label: "Website", type: "url" },
          { key: "admissions_url", label: "Admissions", type: "url" },
          { key: "research_sources", label: "Sources consulted", type: "list" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
      colleges: {
        file: "colleges.json", label: "Colleges", singular: "College", page: "colleges.html",
        intro: "Undergraduate colleges and universities. Reformed and Presbyterian colleges come first; families who want a conservative education that is not necessarily Reformed will find conservative and broadly evangelical colleges further down; PC(USA)-affiliated colleges are flagged.",
        cardMeta: ["location", "doctrinal_posture"], filters: ["doctrinal_posture", "tradition", "delivery"],
        groupBy: "doctrinal_posture",
        fields: [
          { key: "doctrinal_posture", label: "Theological posture" },
          { key: "location", label: "Location" },
          { key: "founded", label: "Founded" },
          { key: "tradition", label: "Tradition" },
          { key: "affiliation", label: "Denomination / Affiliation" },
          { key: "doctrinal_basis", label: "Doctrinal basis" },
          { key: "points_to_weigh", label: "Points to weigh", type: "list" },
          { key: "degree_programs", label: "Degree Programs", type: "list" },
          { key: "delivery", label: "Delivery", type: "list" },
          { key: "accreditation", label: "Accreditation" },
          { key: "tuition", label: "Tuition" },
          { key: "website", label: "Website", type: "url" },
          { key: "admissions_url", label: "Admissions", type: "url" },
          { key: "research_sources", label: "Sources consulted", type: "list" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
      schools: {
        file: "schools.json", label: "Christian Schools", singular: "Christian School", page: "schools.html",
        intro: "Associations, networks and schools for children and families, distinguished by confessional emphasis. A Christian school is not necessarily a Reformed school; read each entry's doctrinal basis.",
        cardMeta: ["org_type", "location"], filters: ["emphasis", "org_type"],
        fields: [
          { key: "org_type", label: "Type" },
          { key: "emphasis", label: "Emphasis", type: "list" },
          { key: "location", label: "Location" },
          { key: "grades", label: "Grades Served" },
          { key: "founded", label: "Founded" },
          { key: "affiliation", label: "Denomination / Affiliation" },
          { key: "doctrinal_basis", label: "Doctrinal basis" },
          { key: "points_to_weigh", label: "Points to weigh", type: "list" },
          { key: "accreditation", label: "Accreditation" },
          { key: "tuition", label: "Tuition" },
          { key: "website", label: "Website", type: "url" },
          { key: "research_sources", label: "Sources consulted", type: "list" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
      courses: {
        file: "courses.json", label: "Online Courses", singular: "Course Provider", page: "courses.html",
        intro: "Providers of courses in Reformed theology, church history, Scripture and related subjects, both credit-bearing seminary programs and non-credit lay teaching.",
        cardMeta: ["provider", "format"], filters: ["format", "level"],
        fields: [
          { key: "provider", label: "Provider" },
          { key: "format", label: "Format" },
          { key: "level", label: "Level" },
          { key: "subject", label: "Subject" },
          { key: "cost", label: "Cost" },
          { key: "doctrinal_basis", label: "Doctrinal basis" },
          { key: "points_to_weigh", label: "Points to weigh", type: "list" },
          { key: "website", label: "Website", type: "url" },
          { key: "research_sources", label: "Sources consulted", type: "list" },
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
          { key: "doctrinal_basis", label: "Doctrinal basis" }, { key: "points_to_weigh", label: "Points to weigh", type: "list" }, { key: "research_sources", label: "Sources consulted", type: "list" }, { key: "website", label: "Website", type: "url" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
      publishers: {
        file: "publishers.json", label: "Publishers", singular: "Publisher", page: "publishers.html",
        intro: "Publishers of Reformed books, curricula and study materials. Start with the publisher, then find the books.",
        cardMeta: ["location", "doctrinal_posture"], filters: ["doctrinal_posture"],
        fields: [{ key: "doctrinal_posture", label: "Theological posture" }, { key: "location", label: "Location" }, { key: "tradition", label: "Tradition" }, { key: "website", label: "Website", type: "url" }, { key: "doctrinal_basis", label: "Doctrinal basis" }, { key: "points_to_weigh", label: "Points to weigh", type: "list" }, { key: "research_sources", label: "Sources consulted", type: "list" }, { key: "description", label: "Description", type: "text" }],
      },
      authors: {
        file: "authors.json", label: "Authors", singular: "Author", page: "authors.html",
        intro: "Reformed theologians and writers. Filter by topic, ease of reading and original language. Each profile will eventually gather an author's books, courses, lectures and articles.",
        cardMeta: ["dates", "tradition"], filters: ["topics", "reading_level", "original_language"],
        fields: [
          { key: "dates", label: "Lived" },
          { key: "tradition", label: "Tradition" },
          { key: "topics", label: "Topics", type: "list" },
          { key: "reading_level", label: "Ease of reading" },
          { key: "original_language", label: "Original language", type: "list" },
          { key: "reading_note", label: "Reading guide notes" },
          { key: "reading_sources", label: "Reading guides consulted", type: "list" },
          { key: "works", label: "Principal Works", type: "list" },
          { key: "website", label: "Website", type: "url" },
          { key: "description", label: "Description", type: "text" },
        ],
      },
      podcasts: {
        file: "podcasts.json", label: "Podcasts & Audio", singular: "Podcast", page: "podcasts.html",
        intro: "Podcasts and audio programs on Reformed theology, church life and history.",
        cardMeta: ["creator", "doctrinal_posture"], filters: ["subject", "doctrinal_posture"],
        fields: [{ key: "doctrinal_posture", label: "Theological posture" }, { key: "creator", label: "Host / Producer" }, { key: "organization", label: "Organization" }, { key: "subject", label: "Subjects", type: "list" }, { key: "website", label: "Website", type: "url" }, { key: "doctrinal_basis", label: "Doctrinal basis" }, { key: "points_to_weigh", label: "Points to weigh", type: "list" }, { key: "research_sources", label: "Sources consulted", type: "list" }, { key: "description", label: "Description", type: "text" }],
      },
      lectures: {
        file: "lectures.json", label: "Lectures & Video", singular: "Lecture Provider", page: "lectures.html",
        intro: "Lecture series and video teaching from seminaries and ministries.",
        cardMeta: ["provider"], filters: ["subject"],
        fields: [{ key: "provider", label: "Provider" }, { key: "subject", label: "Subjects", type: "list" }, { key: "website", label: "Website", type: "url" }, { key: "doctrinal_basis", label: "Doctrinal basis" }, { key: "points_to_weigh", label: "Points to weigh", type: "list" }, { key: "research_sources", label: "Sources consulted", type: "list" }, { key: "description", label: "Description", type: "text" }],
      },
      family: {
        file: "family.json", label: "Family & Children's Education", singular: "Family Resource", page: "family.html",
        intro: "Catechisms, curricula, family worship and other resources for parents and children.",
        cardMeta: ["kind", "provider"], filters: ["kind"],
        fields: [{ key: "kind", label: "Type" }, { key: "provider", label: "Provider" }, { key: "audience", label: "Audience" }, { key: "website", label: "Website", type: "url" }, { key: "doctrinal_basis", label: "Doctrinal basis" }, { key: "points_to_weigh", label: "Points to weigh", type: "list" }, { key: "research_sources", label: "Sources consulted", type: "list" }, { key: "description", label: "Description", type: "text" }],
      },
      officers: {
        file: "officers.json", label: "Church Officer Education", singular: "Officer Training", page: "officers.html",
        intro: "Training and resources for elders, deacons and pastors.",
        cardMeta: ["office"], filters: ["office"],
        fields: [{ key: "office", label: "Office", type: "list" }, { key: "provider", label: "Provider / Denomination" }, { key: "website", label: "Website", type: "url" }, { key: "doctrinal_basis", label: "Doctrinal basis" }, { key: "points_to_weigh", label: "Points to weigh", type: "list" }, { key: "research_sources", label: "Sources consulted", type: "list" }, { key: "description", label: "Description", type: "text" }],
      },
      catechisms: {
        file: "catechisms.json", label: "Catechisms", singular: "Catechism", page: "catechisms.html",
        intro: "Catechisms and confessions, with tools for study and memorization.",
        cardMeta: ["kind"], filters: [], detailPage: "catechism.html",
        fields: [],
      },
    },

    /* Explanations shown above each group on grouped directory pages (colleges, seminaries). */
    postureNotes: {
      "Confessional Reformed": "Trustees and faculty are documented as subscribing to a Reformed confession (the Westminster Standards, the Three Forms of Unity or similar).",
      "Reformed heritage": "Reformed or Presbyterian identity or denominational ties, but faculty subscription to a confession was not documented in the sources reviewed, or the school's positions are broader or publicly contested. Read each entry's points to weigh.",
      "Conservative evangelical": "Not necessarily Reformed. Doctrinally conservative Baptist, fundamentalist and non-denominational schools with statements of faith on inerrancy and creation. They differ from the Westminster Standards on matters such as baptism, church government and eschatology. A good fit for families seeking a conservative education that is not strictly Reformed.",
      "Broadly evangelical": "Evangelical schools with an inerrancy-based statement of faith but broader communities of faculty and students. Positions on gender roles, origins and sexuality vary by school; check each entry.",
      "Mainline (PC(USA))": "Affiliated with the Presbyterian Church (U.S.A.), which since 2011 permits ordination of openly gay and lesbian officers and since 2015 defines marriage as between two persons. Listed so readers can recognize Presbyterian-named schools that are not aligned with the PCA or OPC.",
    },
    classificationNotice: "Groupings are reformededucation.org's own classification, made from each school's published statements and the sources listed on its page. They describe, and do not endorse. Institutions change; confirm current statements with the school.",

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
      if (type === "catechisms" && entry.structure === "chapters") return `confession.html?id=${encodeURIComponent(entry.id)}`;
      if (c && c.detailPage) return `${c.detailPage}?id=${encodeURIComponent(entry.id)}`;
      return `entry.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(entry.id)}`;
    },
  };
})();
