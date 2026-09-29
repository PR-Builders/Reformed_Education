RE.pages.library = function () {
  const parts = [
    ["publishers", "I", "Start with the publisher, then find the books."],
    ["authors", "II", "Profiles of Reformed theologians and writers."],
    ["podcasts", "III", "Audio programs on theology, church life and history."],
    ["lectures", "IV", "Lecture series and video teaching."],
    ["resources", "V", "Organizations and educational resources."],
    ["family", "VI", "Resources for parents and children."],
  ];
  document.getElementById("library-cards").innerHTML = parts.map(([k, n, blurb]) =>
    RE.ui.categoryCard({ numeral: n, label: RE.config.collections[k].label, href: RE.config.collections[k].page, blurb })).join("");
};
