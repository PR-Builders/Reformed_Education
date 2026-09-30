/* Renders the shared header/footer and starts the page script named by <body data-page>. Load last. */
(function () {
  const { esc, seal } = { esc: RE.ui.esc, seal: RE.ui.seal };
  const page = document.body.dataset.page;
  const c = RE.config;

  const searchForm = (id) => `<form class="search-form" role="search" action="search.html" method="get">
      <label class="sr-only" for="${id}">Search Reformed education</label>
      <input class="input" id="${id}" type="search" name="q" placeholder="Search Reformed education…" autocomplete="off">
      <button class="btn btn-primary" type="submit">Search</button></form>`;

  const header = `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header"><div class="container">
    <div class="header-top">
      <a class="brand" href="index.html" aria-label="${esc(c.siteName)} — home">
        ${seal().replace("<svg ", '<svg style="color:var(--color-gold)" ')}
        <span class="brand-text"><span class="brand-name">Reformed</span><span class="brand-sub">Education</span></span>
      </a>
      <div class="header-search">${searchForm("hs")}</div>
      <button class="btn menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    </div></div>
    <nav class="site-nav" id="site-nav" aria-label="Primary"><div class="container">
      <ul>${c.nav.map((n) => {
        const groups = n.groups || [];
        const kids = groups.flatMap((g) => g.items);
        const here = (n.keys || []).includes(page) || kids.some((k) => k.key === page);
        const item = (k) => `<li><a href="${k.href}"${k.key === page ? ' aria-current="page"' : ""}>${esc(k.label)}</a></li>`;
        return `<li${groups.length ? ' class="has-sub"' : ""}><a href="${n.href}"${here ? ' aria-current="page"' : ""}>${esc(n.label)}</a>${groups.length ? `<button type="button" class="sub-toggle" aria-expanded="false" aria-label="${esc(n.label)} menu">▾</button>
          <div class="submenu">${groups.map((g) => `<div class="submenu-col"><p class="submenu-title">${esc(g.title)}</p><ul>${g.items.map(item).join("")}</ul></div>`).join("")}</div>` : ""}</li>`; }).join("")}</ul>
      <div class="nav-search">${searchForm("ns")}</div>
    </div></nav>
  </header>`;

  const footer = `<footer class="site-footer"><div class="container">
    <div class="footer-grid">
      <div><h4>Reformed Education</h4><p>${esc(c.tagline)}</p>
        <p class="motto" lang="la">${esc(c.latinTagline)} <span>· ${esc(c.latinTranslation)}</span></p>
        <p class="muted">A directory and resource hub for Reformed Christian education. Early foundation — directory details are being added.</p></div>
      <div><h4>Explore</h4><ul>${c.categories.map((x) => `<li><a href="${x.href}">${esc(x.label)}</a></li>`).join("")}</ul></div>
      <div><h4>Site</h4><ul><li><a href="browse.html">Browse</a></li><li><a href="search.html">Search</a></li><li><a href="sources.html">Sources &amp; Copyright</a></li><li><a href="about.html">About</a></li></ul></div>
    </div>
    <p class="footer-note">Nothing on this site is an endorsement. Directory information is provided for discovery; always verify details with the institution.</p>
  </div></footer>`;

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);

  const toggle = document.querySelector(".menu-toggle");
  toggle.addEventListener("click", () => {
    const open = document.getElementById("site-nav").classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });

  document.querySelectorAll(".sub-toggle").forEach((b) => b.addEventListener("click", () => {
    const li = b.parentElement, open = !li.classList.contains("open");
    document.querySelectorAll(".has-sub.open").forEach((x) => { x.classList.remove("open"); x.querySelector(".sub-toggle").setAttribute("aria-expanded", "false"); });
    li.classList.toggle("open", open); b.setAttribute("aria-expanded", String(open));
  }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll(".has-sub.open").forEach((x) => { x.classList.remove("open"); x.querySelector(".sub-toggle").setAttribute("aria-expanded", "false"); }); });
  if (RE.pages[page]) RE.pages[page]();
})();
