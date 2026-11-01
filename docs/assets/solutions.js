// Filter the worked-solutions index by paper, section and free text (year, topic, "Q5").
// Without JavaScript every question is listed; the filter only hides rows.
(function () {
  "use strict";
  function ready(fn) {
    if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    var form = document.getElementById("sol-filter");
    if (!form) return;
    form.hidden = false;
    var text = form.querySelector("#sol-q"), paper = form.querySelector("#sol-paper"),
        section = form.querySelector("#sol-section"), avail = form.querySelector("#sol-avail"),
        count = document.getElementById("sol-count");
    var rows = Array.prototype.slice.call(document.querySelectorAll("tr[data-k]"));
    var years = Array.prototype.slice.call(document.querySelectorAll(".sol-year"));

    function apply() {
      var words = text.value.toLowerCase().split(/\s+/).filter(Boolean), p = paper.value,
          s = section.value, a = avail.checked, shown = 0;
      rows.forEach(function (tr) {
        var ok = (!p || tr.dataset.p === p) && (!s || tr.dataset.s === s) && (!a || tr.dataset.a === "1") &&
                 words.every(function (w) { return tr.dataset.k.indexOf(w) !== -1; });
        tr.hidden = !ok;
        if (ok) shown++;
      });
      years.forEach(function (y) { y.hidden = !y.querySelector("tr[data-k]:not([hidden])"); });
      count.textContent = shown === rows.length ? "" : shown + " of " + rows.length + " questions shown";
    }
    form.addEventListener("input", apply);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    var q = new URLSearchParams(window.location.search).get("q");
    if (q) text.value = q;
    apply();
  });
})();
