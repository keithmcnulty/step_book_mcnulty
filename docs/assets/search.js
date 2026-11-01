/* Beyond STEP: client-side search over assets/search-index.json (built by build_site.py) */
(function () {
  "use strict";
  var input = document.getElementById("search-input");
  var results = document.getElementById("search-results");
  var status = document.getElementById("search-status");
  if (!input || !results) return;

  var root = document.body.getAttribute("data-root") || "../";
  var engine = null, docs = {};

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function snippet(text, terms) {
    var lower = text.toLowerCase(), at = -1;
    for (var i = 0; i < terms.length && at < 0; i++) at = lower.indexOf(terms[i].toLowerCase());
    var start = Math.max(0, at < 0 ? 0 : at - 90);
    var out = text.slice(start, start + 260);
    if (start > 0) out = "…" + out.slice(out.indexOf(" ") + 1);
    if (start + 260 < text.length) out = out.slice(0, out.lastIndexOf(" ")) + "…";
    out = esc(out);
    terms.forEach(function (t) {
      if (t.length < 2) return;
      var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  function render(q) {
    q = q.trim();
    if (!q) { results.innerHTML = ""; status.textContent = ""; return; }
    var hits = engine.search(q, { prefix: true, fuzzy: 0.15, combineWith: "AND" });
    if (!hits.length) hits = engine.search(q, { prefix: true, fuzzy: 0.2, combineWith: "OR" });
    status.textContent = hits.length ? hits.length + (hits.length === 1 ? " result" : " results") : "No results. Try fewer or different words.";
    results.innerHTML = hits.slice(0, 40).map(function (h) {
      var d = docs[h.id];
      return '<li><a class="sr-title" href="' + root + d.url + '">' + esc(d.title) + "</a>" +
        '<div class="sr-meta">' + esc(d.meta) + "</div>" +
        '<p class="sr-snip">' + snippet(d.text, h.terms) + "</p></li>";
    }).join("");
  }

  function setQuery(q, push) {
    var url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
    history[push ? "pushState" : "replaceState"](null, "", url);
  }

  status.textContent = "Loading the index…";
  fetch(root + "assets/search-index.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      engine = new MiniSearch({
        fields: ["title", "headings", "text"],
        storeFields: [],
        searchOptions: { boost: { title: 4, headings: 2 } }
      });
      data.forEach(function (d) { docs[d.id] = d; });
      engine.addAll(data);
      var q = new URL(window.location.href).searchParams.get("q") || "";
      input.value = q;
      render(q);
      if (!q) status.textContent = "Search " + data.length + " pages: questions, solutions, glossary and more.";
      var timer;
      input.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () { render(input.value); setQuery(input.value.trim(), false); }, 120);
      });
    })
    .catch(function () { status.textContent = "Sorry, the search index could not be loaded."; });
})();
