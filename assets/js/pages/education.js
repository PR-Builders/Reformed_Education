RE.pages.education = function () {
  document.getElementById("pathways").innerHTML = RE.ui.pathways(RE.config.pathways);
  document.getElementById("categories").innerHTML = RE.config.categories.map(RE.ui.categoryCard).join("");
};
