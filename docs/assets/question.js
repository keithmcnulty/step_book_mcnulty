// Open links to questions in the STEP question database in a compact window beside the book,
// so the reader can keep the question in view while reading. The question is shown on
// step.maths.org's own page, exactly as they serve it: nothing is copied or embedded.
// If the browser blocks the window (or on phones, where windows open as tabs), the link
// behaves as an ordinary link.
(function () {
  "use strict";
  var PREFIX = "https://step.maths.org/questions/";

  function features() {
    var sw = window.screen.availWidth || 1280, sh = window.screen.availHeight || 800;
    var w = Math.min(820, Math.round(sw * 0.5)), h = Math.min(900, sh - 80);
    var left = (window.screenX || 0) + Math.max(0, (window.outerWidth || sw) - w - 20);
    var top = (window.screenY || 0) + 40;
    return "popup=yes,width=" + w + ",height=" + h + ",left=" + left + ",top=" + top +
           ",resizable=yes,scrollbars=yes";
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="' + PREFIX + '"]');
    if (!a) return;
    var win = window.open(a.href, "step-question", features());
    if (!win) return;                 // blocked: fall through to the normal link
    e.preventDefault();
    try { win.opener = null; } catch (err) { /* ignore */ }
    win.focus();
  });

  document.addEventListener("DOMContentLoaded", function () {
    var links = document.querySelectorAll('a[href^="' + PREFIX + '"]');
    for (var i = 0; i < links.length; i++) {
      links[i].classList.add("q-popup");
      if (!links[i].title) links[i].title = "Opens the question in a small window beside this page";
    }
  });
})();
