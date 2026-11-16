/* Beyond STEP: client-side search over assets/search-index.json (built by build_site.py) */
(function () {
  "use strict";
  var input = document.getElementById("search-input");
  var results = document.getElementById("search-results");
  var status = document.getElementById("search-status");
  if (!input || !results) return;

  var root = document.body.getAttribute("data-root") || "../";
  var engine = null, docs = {};
  // Chinese has no spaces between words: index every Chinese character and every pair of neighbouring
  // characters, so a search for 质数 or 数学归纳法 matches; Latin words are split on spaces as usual.
  var zh = /^zh/i.test(document.documentElement.lang || "");
  var CJK = /[\u3400-\u9fff\uf900-\ufaff]/;
  var L = zh ? {
    results: function (n) { return "找到 " + n + " 项结果"; }, none: "没有结果。请尝试较少或不同的字词。",
    loading: "正在载入索引……", ready: function (n) { return "搜索 " + n + " 个页面：题目、解答、词汇表等。"; },
    failed: "抱歉，无法载入搜索索引。"
  } : {
    results: function (n) { return n + (n === 1 ? " result" : " results"); }, none: "No results. Try fewer or different words.",
    loading: "Loading the index…", ready: function (n) { return "Search " + n + " pages: questions, solutions, glossary and more."; },
    failed: "Sorry, the search index could not be loaded."
  };
  function tokenize(text) {
    var out = [];
    String(text).split(/[\s\u3000-\u303f\uff00-\uffef.,;:!?()\[\]{}"'\u2018\u2019\u201c\u201d\u2014\u2013\/\\]+/).forEach(function (w) {
      if (!w) return;
      if (!CJK.test(w)) { out.push(w); return; }
      var run = "";
      for (var i = 0; i <= w.length; i++) {
        var c = w.charAt(i);
        if (c && CJK.test(c)) { run += c; continue; }
        for (var j = 0; j < run.length; j++) {
          out.push(run.charAt(j));
          if (j + 1 < run.length) out.push(run.substr(j, 2));
        }
        run = "";
        if (c) out.push(c);
      }
    });
    return out;
  }

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
    var cjk = zh && CJK.test(q);
    var hits = engine.search(q, { prefix: !cjk, fuzzy: cjk ? 0 : 0.15, combineWith: "AND" });
    if (!hits.length) hits = engine.search(q, { prefix: !cjk, fuzzy: cjk ? 0 : 0.2, combineWith: "OR" });
    status.textContent = hits.length ? L.results(hits.length) : L.none;
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

  status.textContent = L.loading;
  fetch(root + "assets/search-index.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var opts = {
        fields: ["title", "headings", "text"],
        storeFields: [],
        searchOptions: { boost: { title: 4, headings: 2 } }
      };
      if (zh) { opts.tokenize = tokenize; opts.searchOptions.tokenize = tokenize; }
      engine = new MiniSearch(opts);
      data.forEach(function (d) { docs[d.id] = d; });
      engine.addAll(data);
      var q = new URL(window.location.href).searchParams.get("q") || "";
      input.value = q;
      render(q);
      if (!q) status.textContent = L.ready(data.length);
      var timer;
      input.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () { render(input.value); setQuery(input.value.trim(), false); }, 120);
      });
    })
    .catch(function () { status.textContent = L.failed; });
})();
