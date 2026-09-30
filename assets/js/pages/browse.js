RE.pages.browse = function () {
  document.getElementById("pathways").innerHTML = RE.ui.pathways(RE.config.pathways);
  const groups = RE.config.nav.find((n) => n.groups).groups;
  const cards = (g) => g.items.map((k, i) => RE.ui.categoryCard({ numeral: ["I", "II", "III", "IV", "V"][i], label: k.label, href: k.href, blurb: k.blurb })).join("");
  document.getElementById("study-cards").innerHTML = cards(groups[0]);
  document.getElementById("read-cards").innerHTML = cards(groups[1]);
};
