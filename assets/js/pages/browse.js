RE.pages.browse = function () {
  document.getElementById("pathways").innerHTML = RE.ui.pathways(RE.config.pathways);
  const groups = RE.config.nav.find((n) => n.groups).groups;
  const rn = (i) => ["I", "II", "III", "IV", "V", "VI", "VII"][i];
  document.getElementById("browse-groups").innerHTML = groups.map((g) => `<section class="section" id="${g.title === "Read and listen" ? "read" : g.title.toLowerCase()}"><div class="container">
    <div class="section-head"><p class="label">${RE.ui.esc(g.title)}</p></div>
    <div class="grid grid-cards">${g.items.map((k, i) => RE.ui.categoryCard({ numeral: rn(i), label: k.label, href: k.href, blurb: k.blurb })).join("")}</div></div></section>`).join("");
};
