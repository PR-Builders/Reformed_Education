RE.pages.sources = function () {
  document.getElementById("example").innerHTML = RE.ui.citation({
    title: "Example resource title", author: "Example Author", organization: "Example Ministries",
    url: "https://example.org/", date: "2000", copyright_status: "retained",
    license: "All rights reserved by the publisher.",
  });
};
